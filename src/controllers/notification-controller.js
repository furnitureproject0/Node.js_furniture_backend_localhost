import asyncHandler from 'express-async-handler';
import { getUserNotificationsService } from '../services/notification/index.js';

export const getMyNotifications = asyncHandler(async (req, res) => {
    const userId = req.user.id; 
    const { page, limit } = req.query;

    const result = await getUserNotificationsService(userId, { page, limit });

    res.status(200).json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: result.notifications,
        meta: result.pagination
    });
});