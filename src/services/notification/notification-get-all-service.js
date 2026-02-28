'use strict';

import { Notification, NotificationRecipient, User } from '../../models/index.js';
import AppError from '../../utils/AppError.js';

/**
 * Get all notifications for a specific user with pagination
 * @param {number} userId - The ID of the user
 * @param {Object} pagination - Pagination options { page, limit }
 * @param {Object} options - Database transaction options
 * @returns {Object} { notifications: [], pagination }
 */
export const getUserNotificationsService = async (userId, pagination = {}, options = {}) => {
    const { transaction } = options;

    const page = parseInt(pagination.page, 10) || 1;
    const limit = parseInt(pagination.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: recipients } = await NotificationRecipient.findAndCountAll({
        where: { 
            user_id: userId,
            show: true 
        },
        include: [
            {
                model: Notification,
                as: 'notification',
                // if you want to get actor details, you can include the User model here as well
                // include: [{ model: User, as: 'actor', attributes: ['id', 'name', 'avatar'] }]
            }
        ],
        limit,
        offset,
        order: [['created_at', 'DESC']],
        transaction
    });

    const paginationMetadata = {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit
    };

    const formattedNotifications = recipients.map(recipient => {
        const notif = recipient.notification;
        return {
            id: recipient.id, 
            notification_id: notif.id,
            title: notif.title,
            message: notif.message,
            type: notif.type,
            entity_type: notif.entity_type,
            entity_id: notif.entity_id,
            payload: notif.payload,
            is_read: recipient.read_at !== null,
            read_at: recipient.read_at,
            created_at: recipient.createdAt
        };
    });

    return {
        notifications: formattedNotifications,
        pagination: paginationMetadata
    };
};