import { Order, OrderService, OrderTimeline, Offer } from '../../models/index.js';
import AppError from '../../utils/AppError.js';
import { canCancelOrder } from './order.status.js';

/**
 * Cancels an order and all related entities
 * @param {Object} params
 * @param {Object} params.order - Order instance with loaded orderServices
 * @param {string} params.reason - Cancellation reason (optional)
 * @param {Object} params.transaction - Sequelize transaction
 */
export const cancelOrderWithRelations = async ({ order, reason, transaction }) => {
    // Update order status
    await order.update({ status: 'cancelled' }, { transaction });

    // Cancel all non-completed order services
    for (const orderService of order.orderServices) {
        if (orderService.status !== 'completed') {
            await orderService.update({ status: 'cancelled' }, { transaction });
        }
    }

    // Cancel all pending offers
    const pendingOffers = await Offer.findAll({
        include: [
            {
                model: OrderService,
                as: 'orderService',
                where: { order_id: order.id },
                attributes: []
            }
        ],
        where: { status: 'pending' },
        transaction
    });

    for (const offer of pendingOffers) {
        await offer.update({ status: 'cancelled' }, { transaction });
    }

    // Add timeline entry
    await OrderTimeline.create({
        order_id: order.id,
        status: 'cancelled',
        message: `Order has been cancelled${reason ? `. Reason: ${reason}` : ''}`
    }, { transaction });
};

/**
 * Validates that an order can be cancelled
 * @param {number} orderId - Order ID to check
 * @throws {AppError} If order cannot be cancelled
 */
export const validateOrderCanBeCancelled = async (orderId) => {
    const canCancel = await canCancelOrder(orderId);
    if (!canCancel) {
        throw new AppError('Order cannot be cancelled because it has completed services', 400);
    }
};
