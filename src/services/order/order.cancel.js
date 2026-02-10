import { Order, OrderService as OrderServiceModel, Service } from '../../models/index.js';
import sequelize from '../../config/database.js';
import AppError from '../../utils/AppError.js';
import { validateOrderOwnership, validateOrderCanBeUpdated } from './order.validation.js';
import { cancelOrderWithRelations, validateOrderCanBeCancelled } from './order.cancellation.js';

/**
 * Cancels an order (unified across roles)
 * @param {Object} params
 * @param {number} params.orderId - Order ID to cancel
 * @param {number} params.userId - User ID performing the cancellation
 * @param {string} params.userRole - User role (for authorization)
 * @param {string} params.reason - Optional cancellation reason
 * @param {Object} params.options - Optional configuration
 * @param {boolean} params.options.skipOwnershipCheck - Skip ownership validation (for admin cancellations)
 * @returns {Object} Cancelled order
 */
export const cancelOrder = async ({
    orderId,
    userId,
    userRole,
    reason,
    options = {}
}) => {
    const {
        skipOwnershipCheck = false
    } = options;

    await sequelize.transaction(async (t) => {
        const existingOrder = await Order.findByPk(orderId, {
            include: [
                {
                    model: OrderServiceModel,
                    as: 'orderServices',
                    include: [{ model: Service, as: 'service' }]
                }
            ],
            transaction: t
        });

        if (!existingOrder) {
            throw new AppError('Order not found', 404);
        }

        // Validate ownership (unless site_admin or skipped)
        if (!skipOwnershipCheck && userRole !== 'site_admin' && userId) {
            validateOrderOwnership(existingOrder, userId);
        }

        // Check if order can be cancelled
        await validateOrderCanBeCancelled(existingOrder.id);

        // Cancel order and all related entities
        await cancelOrderWithRelations({
            order: existingOrder,
            reason,
            transaction: t
        });
    });

    // Return the cancelled order (no need to reload, status is already updated)
    return await Order.findByPk(orderId);
};
