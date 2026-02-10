import { OrderService, OrderServiceAddition, Service, OrderTimeline, Offer, Order, User, Company } from '../../models/index.js';
import sequelize from '../../config/database.js';
import AppError from '../../utils/AppError.js';
import { canCancelOrderService, updateOrderStatusBasedOnServices } from './order.status.js';
import { createAndSendNotification } from '../../utils/notifications.js';

/**
 * Creates order services and their additions
 * @param {Object} params
 * @param {number} params.orderId - Order ID
 * @param {Array} params.services - Array of service objects with service_id and additions
 * @param {Object} params.transaction - Sequelize transaction
 */
export const createOrderServicesAndAdditions = async ({ orderId, services, transaction }) => {
    for (const { service_id, additions } of services) {
        const orderService = await OrderService.create({
            order_id: orderId,
            service_id: service_id,
            status: 'pending'
        }, { transaction });

        if (additions?.length) {
            const additionRecords = additions.map(add => ({
                order_service_id: orderService.id,
                addition_id: add.addition_id,
                note: add.note || null
            }));

            await OrderServiceAddition.bulkCreate(additionRecords, { transaction });
        }
    }
};

/**
 * Replaces all order services and their additions
 * @param {Object} params
 * @param {number} params.orderId - Order ID
 * @param {Array} params.services - Array of service objects with service_id and additions
 * @param {Object} params.transaction - Sequelize transaction
 */
export const replaceOrderServices = async ({ orderId, services, transaction }) => {
    // Delete existing services (cascade delete will handle additions)
    await OrderService.destroy({ where: { order_id: orderId }, transaction });

    // Create new services and their additions
    await createOrderServicesAndAdditions({ orderId, services, transaction });
};

/**
 * Cancels an order service (unified across roles)
 * @param {Object} params
 * @param {number} params.orderServiceId - Order Service ID
 * @param {Object} params.actor - Actor performing the cancellation { id, role, company_id }
 * @param {string} params.reason - Optional cancellation reason
 * @returns {Promise<OrderService>} Cancelled order service
 */
export const cancelOrderService = async ({ orderServiceId, actor, reason }) => {
    const { role, company_id } = actor;

    const result = await sequelize.transaction(async (t) => {
        // Fetch order service with necessary relations
        const orderService = await OrderService.findByPk(orderServiceId, {
            include: [
                {
                    model: Service,
                    attributes: ['name'],
                    as: 'service'
                },
                {
                    model: Order,
                    attributes: ['id', 'client_id'],
                    as: 'order'
                }
            ],
            transaction: t
        });

        if (!orderService) {
            throw new AppError('Order service not found', 404);
        }

        // Role-based validation
        if (role === 'client') {
            // Client must own the order
            if (orderService.order.client_id !== actor.id) {
                throw new AppError('Not authorized to cancel this order service', 403);
            }
        } else if (role === 'company_admin') {
            // Company admin must own the service
            if (orderService.company_id !== company_id) {
                throw new AppError('Order service not assigned to your company', 403);
            }
        }
        // site_admin has no constraints

        // Check if service can be cancelled (not completed)
        const canCancel = await canCancelOrderService(orderServiceId, t);
        if (!canCancel) {
            throw new AppError('Order service cannot be cancelled because it is already completed', 400);
        }

        // Update OrderService status
        await orderService.update({
            status: 'cancelled'
        }, { transaction: t });

        // Cancel any pending offers for this OrderService
        const pendingOffers = await Offer.findAll({
            where: {
                order_service_id: orderServiceId,
                status: 'pending'
            },
            transaction: t
        });

        for (const offer of pendingOffers) {
            await offer.update(
                { status: 'cancelled' },
                { transaction: t }
            );
        }

        // Add timeline entry
        const actorLabel = role === 'client' ? 'client' : role === 'company_admin' ? 'company' : 'admin';
        await OrderTimeline.create({
            order_id: orderService.order.id,
            status: 'cancelled',
            message: `Service "${orderService.service.name}" has been cancelled by the ${actorLabel}${reason ? `. Reason: ${reason}` : ''}`
        }, { transaction: t });

        // Update order status based on all services
        await updateOrderStatusBasedOnServices(orderService.order.id, t);

        return orderService;
    });

    // Send notifications (non-blocking)
    setImmediate(async () => {
        try {
            const order = await Order.findByPk(result.order.id);

            // Notify client if cancelled by company/admin
            if (role !== 'client' && order) {
                await createAndSendNotification({
                    user_id: order.client_id,
                    title: 'Service Cancelled',
                    message: `Service "${result.service.name}" for order #${order.id} has been cancelled${reason ? `. Reason: ${reason}` : ''}.`,
                    type: 'order',
                    payload: {
                        order_id: order.id,
                        order_service_id: orderServiceId,
                        link: `/orders/${order.id}`
                    }
                });
            }

            // Notify site admin if cancelled by company
            if (role === 'company_admin') {
                const siteAdmin = await User.findOne({ where: { role: 'site_admin' } });
                const company = await Company.findByPk(company_id);

                if (siteAdmin && company) {
                    await createAndSendNotification({
                        user_id: siteAdmin.id,
                        title: 'Order Service Cancelled',
                        message: `${company.name} has cancelled the order service "${result.service.name}" for order #${order.id}${reason ? `. Reason: ${reason}` : ''}.`,
                        type: 'order',
                        payload: {
                            order_id: order.id,
                            order_service_id: orderServiceId,
                            company_id: company.id,
                            company_name: company.name,
                            action: 'service_cancelled',
                            link: `/admin/orders/${order.id}`
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Failed to send cancellation notifications:', error);
        }
    });

    return result;
};
