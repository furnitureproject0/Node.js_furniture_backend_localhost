import { getSocketIO, getUserSocket } from '../config/socket.js';
import Notification from '../models/notification.js';
import User from '../models/user.js';

export const createNotification = async (data, options = {}) => {
    try {
        const notification = await Notification.create(data, options);
        return notification;
    } catch (error) {
        console.error('Failed to create notification:', error);
        throw error;
    }
};


export const sendNotification = async (notification) => {
    try {
        // Get user's socket if they're connected
        const socket = getUserSocket(notification.user_id);

        if (socket) {
            socket.emit('notification', notification);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to send notification:', error);
        return false;
    }
};


export const createAndSendNotification = async (data, options = {}) => {
    const notification = await createNotification(data, options);
    const sent = await sendNotification(notification);
    return { notification, sent };
};


// Notify company admin after an order service is assigned
export const notifyCompanyAdminAssigned = async ({ companyId, orderId, orderServiceId }) => {
    try {
        const companyAdmin = await User.findOne({
            where: {
                role: 'company_admin',
                company_id: companyId
            }
        })
        console.log(companyAdmin)

        const payload = {
            order_id: orderId,
            order_service_id: orderServiceId,
            link: `orders/${orderId}`
        };

        const baseData = {
            title: 'Order Service Assigned',
            message: `A new order service was assigned to your company for order #${orderId}.`,
            type: 'order',
            payload,
        };

        if (companyAdmin) {
            return await createAndSendNotification({ ...baseData, user_id: companyAdmin.id });
        }

    } catch (error) {
        console.error('Failed to notify company admin:', error);
        return null;
    }
};


export const markNotificationAsRead = async (notificationId, userId) => {
    try {
        const [updated] = await Notification.update(
            { is_read: true },
            {
                where: {
                    id: notificationId,
                    user_id: userId
                }
            }
        );
        return updated > 0;
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
        return false;
    }
};


export const getUnreadNotifications = async (userId, limit = 10) => {
    try {
        const notifications = await Notification.findAll({
            where: {
                user_id: userId,
                is_read: false
            },
            order: [['created_at', 'DESC']],
            limit
        });
        return notifications;
    } catch (error) {
        console.error('Failed to get unread notifications:', error);
        throw error;
    }
};


// Notify client when company admin cancels an offer
export const notifyClientOfferCancelled = async ({ clientId, offerId, orderId, orderServiceId, serviceName }) => {
    try {
        const payload = {
            offer_id: offerId,
            order_id: orderId,
            order_service_id: orderServiceId,
            service_name: serviceName,
            action: 'offer_cancelled',
            link: `/orders/${orderId}`
        };

        const notificationData = {
            user_id: clientId,
            title: 'Offer Cancelled',
            message: `The offer for service "${serviceName}" has been cancelled by the company.`,
            type: 'offer',
            payload
        };

        return await createAndSendNotification(notificationData);
    } catch (error) {
        console.error('Failed to notify client of offer cancellation:', error);
        return null;
    }
};


// Notify company admin when client accepts an offer
export const notifyCompanyAdminOfferAccepted = async ({ companyId, offerId, orderId, orderServiceId, serviceName }) => {
    try {
        const companyAdmin = await User.findOne({
            where: {
                role: 'company_admin',
                company_id: companyId
            }
        });

        if (!companyAdmin) {
            console.warn(`No company admin found for company ${companyId}`);
            return null;
        }

        const payload = {
            offer_id: offerId,
            order_id: orderId,
            order_service_id: orderServiceId,
            service_name: serviceName,
            action: 'offer_accepted',
            link: `/orders/${orderId}`
        };

        const notificationData = {
            user_id: companyAdmin.id,
            title: 'Offer Accepted',
            message: `Your offer for service "${serviceName}" has been accepted by the client.`,
            type: 'offer',
            payload
        };

        return await createAndSendNotification(notificationData);
    } catch (error) {
        console.error('Failed to notify company admin of offer acceptance:', error);
        return null;
    }
};


// Notify company admin when client rejects an offer
export const notifyCompanyAdminOfferRejected = async ({ companyId, offerId, orderId, orderServiceId, serviceName }) => {
    try {
        const companyAdmin = await User.findOne({
            where: {
                role: 'company_admin',
                company_id: companyId
            }
        });

        if (!companyAdmin) {
            console.warn(`No company admin found for company ${companyId}`);
            return null;
        }

        const payload = {
            offer_id: offerId,
            order_id: orderId,
            order_service_id: orderServiceId,
            service_name: serviceName,
            action: 'offer_rejected',
            link: `/orders/${orderId}`
        };

        const notificationData = {
            user_id: companyAdmin.id,
            title: 'Offer Rejected',
            message: `Your offer for service "${serviceName}" has been rejected by the client.`,
            type: 'offer',
            payload
        };

        return await createAndSendNotification(notificationData);
    } catch (error) {
        console.error('Failed to notify company admin of offer rejection:', error);
        return null;
    }
};