import { createAndSendNotification } from '../../utils/notifications.js';
import { User } from '../../models/index.js';

/**
 * Sends notifications after order creation
 * This should be called asynchronously after the HTTP response
 * @param {Object} params
 * @param {number} params.orderId - Order ID
 * @param {number} params.clientId - Client user ID
 * @param {string} params.clientName - Client name
 */
export const notifyOrderCreated = async ({ orderId, clientId, clientName }) => {
    try {
        // Notify client
        await createAndSendNotification({
            user_id: clientId,
            title: 'Order Created Successfully',
            message: `Your order #${orderId} has been created successfully. We'll notify you when companies start making offers.`,
            type: 'order',
            payload: {
                order_id: orderId,
                link: `/orders/${orderId}`
            }
        });

        // Notify site admins
        const siteAdmins = await User.findAll({ where: { role: 'site_admin' } });

        for (const admin of siteAdmins) {
            await createAndSendNotification({
                user_id: admin.id,
                title: 'New Order Added',
                message: `A new order #${orderId} has been created by ${clientName}.`,
                type: 'order',
                payload: {
                    order_id: orderId,
                    link: `/admin/orders/${orderId}`
                }
            });
        }
    } catch (error) {
        console.error('Failed to send order creation notifications:', error);
    }
};

/**
 * Sends notifications after order cancellation
 * This should be called asynchronously after the HTTP response
 * @param {Object} params
 * @param {number} params.orderId - Order ID
 * @param {string} params.reason - Cancellation reason (optional)
 */
export const notifyOrderCancelled = async ({ orderId, reason }) => {
    try {
        // Notify site admins
        const siteAdmins = await User.findAll({ where: { role: 'site_admin' } });

        for (const admin of siteAdmins) {
            await createAndSendNotification({
                user_id: admin.id,
                title: 'Order Cancelled',
                message: `Order #${orderId} has been cancelled by the client${reason ? `. Reason: ${reason}` : ''}.`,
                type: 'order',
                payload: {
                    order_id: orderId,
                    link: `/admin/orders/${orderId}`
                }
            });
        }
    } catch (error) {
        console.error('Failed to send cancellation notifications:', error);
    }
};
