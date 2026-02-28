import Notification from '../models/notification.js';
import asyncHandler from 'express-async-handler';
import AppError from '../utils/AppError.js';

export const getAllNotifications = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    const { rows: notifications, count } = await Notification.findAndCountAll({
        where: {
            actor_id: userId,
            // show: true
        },
        limit,
        offset,
        order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: {
            notifications
        },
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalItems: count
        }
    });
});

export const getNotificationById = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOne({
        where: {
            id,
            actor_id: userId
        }
    });

    if (!notification) {
        throw new AppError('Notification not found', 404);
    }

    res.status(200).json({
        success: true,
        message: 'Notification retrieved successfully',
        data: {
            notification
        }
    });
});

// Mark a notification as read
export const readNotification = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOne({
        where: {
            id,
            actor_id: userId
        }
    });

    if (!notification) {
        throw new AppError('Notification not found', 404);
    }

    await notification.update({
        is_read: true
    });

    res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: {
            notification
        }
    });
});

export const readAllNotifications = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const [updatedCount] = await Notification.update(
        { is_read: true },
        {
            where: {
                actor_id: userId,
                is_read: false
            }
        }
    );

    res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        data: {
            updatedCount
        }
    });
});

export const hideNotification = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOne({
        where: {
            id,
            actor_id: userId
        }
    });

    if (!notification) {
        throw new AppError('Notification not found', 404);
    }

    // await notification.update({
    //     show: false
    // });

    res.status(200).json({
        success: true,
        message: 'Notification hidden',
        data: {
            notification
        }
    });
});

export const hideAllNotifications = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const [updatedCount] = await Notification.update(
        // { show: false },
        {
            where: {
                actor_id: userId,
                // show: true
            }
        }
    );

    res.status(200).json({
        success: true,
        message: 'All notifications hidden',
        data: {
            updatedCount
        }
    });
});

