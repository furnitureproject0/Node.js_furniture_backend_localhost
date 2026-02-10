import { OrderService, Service, OrderTimeline, User, Company } from '../../models/index.js';
import sequelize from '../../config/database.js';
import AppError from '../../utils/AppError.js';
import { updateOrderStatusBasedOnServices } from './order.status.js';
import { createAndSendNotification } from '../../utils/notifications.js';

/**
 * Private helper: Validates that an order service exists, belongs to company, and is in 'assigned' status
 * @param {number} orderId - Order ID
 * @param {number} orderServiceId - Order Service ID
 * @param {number} companyId - Company ID
 * @returns {Promise<OrderService>} The validated order service
 * @throws {AppError} If validation fails
 */
const validateOrderServiceAccess = async (orderId, orderServiceId, companyId) => {
    const orderService = await OrderService.findOne({
        where: {
            order_id: orderId,
            id: orderServiceId,
            company_id: companyId
        },
        include: [{
            model: Service,
            attributes: ['name'],
            as: 'service'
        }]
    });

    if (!orderService) {
        throw new AppError('Order service not found or not assigned to your company', 404);
    }

    if (orderService.status !== 'assigned') {
        throw new AppError('Order service cannot be accepted/rejected in its current status', 400);
    }

    return orderService;
};

/**
 * Accepts an order service assigned to a company
 * @param {Object} params
 * @param {number} params.companyId - Company ID
 * @param {number} params.orderId - Order ID
 * @param {number} params.orderServiceId - Order Service ID
 * @returns {Promise<OrderService>} Updated order service
 */
export const acceptCompanyOrderService = async ({ companyId, orderId, orderServiceId }) => {
    const result = await sequelize.transaction(async (t) => {
        const orderService = await validateOrderServiceAccess(orderId, orderServiceId, companyId);

        await orderService.update({
            status: 'accepted_by_company'
        }, { transaction: t });

        // Add timeline entry
        await OrderTimeline.create({
            order_id: orderId,
            status: 'assigned',
            message: `Company accepted service "${orderService.service.name}"`
        }, { transaction: t });

        // Update order status based on all services
        await updateOrderStatusBasedOnServices(orderId, t);

        return orderService;
    });

    // Send notification to site admin (non-blocking)
    setImmediate(async () => {
        try {
            const siteAdmin = await User.findOne({ where: { role: 'site_admin' } });
            const company = await Company.findByPk(companyId);

            if (siteAdmin && company) {
                await createAndSendNotification({
                    user_id: siteAdmin.id,
                    title: 'Order Service Accepted',
                    message: `${company.name} has accepted the order service "${result.service.name}" for order #${orderId}.`,
                    type: 'order',
                    payload: {
                        order_id: orderId,
                        order_service_id: orderServiceId,
                        company_id: company.id,
                        company_name: company.name,
                        action: 'service_accepted',
                        link: `/admin/orders/${orderId}`
                    }
                });
            }
        } catch (error) {
            console.error('Failed to send acceptance notification to site admin:', error);
        }
    });

    return result;
};

/**
 * Rejects an order service assigned to a company
 * @param {Object} params
 * @param {number} params.companyId - Company ID
 * @param {number} params.orderId - Order ID
 * @param {number} params.orderServiceId - Order Service ID
 * @param {string} params.reason - Optional rejection reason
 * @returns {Promise<OrderService>} Updated order service
 */
export const rejectCompanyOrderService = async ({ companyId, orderId, orderServiceId, reason }) => {
    const result = await sequelize.transaction(async (t) => {
        const orderService = await validateOrderServiceAccess(orderId, orderServiceId, companyId);

        await orderService.update({
            status: 'rejected_by_company'
        }, { transaction: t });

        // Add timeline entry
        await OrderTimeline.create({
            order_id: orderId,
            status: 'offer_rejected',
            message: `Company rejected service "${orderService.service.name}"${reason ? `. Reason: ${reason}` : ''}`
        }, { transaction: t });

        return orderService;
    });

    // Send notification to site admin (non-blocking)
    setImmediate(async () => {
        try {
            const siteAdmin = await User.findOne({ where: { role: 'site_admin' } });
            const company = await Company.findByPk(companyId);

            if (siteAdmin && company) {
                await createAndSendNotification({
                    user_id: siteAdmin.id,
                    title: 'Order Service Rejected',
                    message: `${company.name} has rejected the order service "${result.service.name}" for order #${orderId}${reason ? `. Reason: ${reason}` : ''}.`,
                    type: 'order',
                    payload: {
                        order_id: orderId,
                        order_service_id: orderServiceId,
                        company_id: company.id,
                        company_name: company.name,
                        reason: reason || null,
                        action: 'service_rejected',
                        link: `/admin/orders/${orderId}`
                    }
                });
            }
        } catch (error) {
            console.error('Failed to send rejection notification to site admin:', error);
        }
    });

    return result;
};
