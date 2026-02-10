import { Order, OrderService } from '../../models/index.js';

/**
 * Updates order status based on the statuses of all its OrderServices
 * @param {number} orderId - The ID of the order to update
 * @param {object} transaction - Sequelize transaction object
 * @returns {Promise<Order>} - Updated order
 */
export const updateOrderStatusBasedOnServices = async (orderId, transaction = null) => {
    const options = transaction ? { transaction } : {};

    // Get all order services for this order
    const orderServices = await OrderService.findAll({
        where: { order_id: orderId },
        ...options
    });

    if (orderServices.length === 0) {
        return null;
    }

    // Count services by status
    const statusCounts = {
        pending: 0,
        assigned: 0,
        accepted_by_company: 0,
        rejected_by_company: 0,
        offer_sent: 0,
        offer_accepted: 0,
        offer_rejected: 0,
        completed: 0,
        cancelled: 0
    };

    orderServices.forEach(os => {
        statusCounts[os.status] = (statusCounts[os.status] || 0) + 1;
    });

    const totalServices = orderServices.length;
    const completedCount = statusCounts.completed || 0;
    const cancelledCount = statusCounts.cancelled || 0;
    const activeCount = totalServices - cancelledCount;

    // Get current order
    const order = await Order.findByPk(orderId, options);

    if (!order) {
        return null;
    }

    let newStatus = order.status;

    // If all services are cancelled, order is cancelled
    if (cancelledCount === totalServices) {
        newStatus = 'cancelled';
    }
    // If all active services are completed, order is completed
    else if (activeCount > 0 && completedCount === activeCount) {
        newStatus = 'completed';
    }
    // If some services are completed but not all, order is partially_done
    else if (completedCount > 0 && completedCount < activeCount) {
        newStatus = 'partially_done';
    }
    // If at least one service is in progress (offer_accepted or accepted_by_company), order is in_progress
    else if (statusCounts.offer_accepted > 0 || statusCounts.accepted_by_company > 0 ||
        statusCounts.offer_sent > 0 || statusCounts.assigned > 0) {
        // Only update to in_progress if order is currently pending
        if (order.status === 'pending') {
            newStatus = 'in_progress';
        }
        // Keep in_progress or partially_done status if already set
        else if (order.status === 'in_progress' || order.status === 'partially_done') {
            newStatus = order.status;
        }
    }

    // Only update if status changed
    if (newStatus !== order.status) {
        await order.update({ status: newStatus }, options);
    }

    return order;
};

/**
 * Checks if an order can be cancelled
 * @param {number} orderId - The ID of the order
 * @param {object} transaction - Sequelize transaction object
 * @returns {Promise<boolean>} - True if order can be cancelled
 */
export const canCancelOrder = async (orderId, transaction = null) => {
    const options = transaction ? { transaction } : {};

    const orderServices = await OrderService.findAll({
        where: { order_id: orderId },
        attributes: ['status'],
        ...options
    });

    // Order can be cancelled if no services are completed
    const hasCompletedServices = orderServices.some(os => os.status === 'completed');
    return !hasCompletedServices;
};

/**
 * Checks if an OrderService can be cancelled
 * @param {number} orderServiceId - The ID of the OrderService
 * @param {object} transaction - Sequelize transaction object
 * @returns {Promise<boolean>} - True if OrderService can be cancelled
 */
export const canCancelOrderService = async (orderServiceId, transaction = null) => {
    const options = transaction ? { transaction } : {};

    const orderService = await OrderService.findByPk(orderServiceId, {
        attributes: ['status'],
        ...options
    });

    if (!orderService) {
        return false;
    }

    // OrderService can be cancelled if it's not already completed
    return orderService.status !== 'completed';
};
