import express from 'express';
import {
    getAllNotifications,
    getNotificationById,
    readNotification,
    readAllNotifications,
    hideNotification,
    hideAllNotifications
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.get('/', protect, getAllNotifications);
router.patch('/read-all', protect, readAllNotifications);
router.patch('/hide-all', protect, hideAllNotifications);
router.get('/:id', protect, getNotificationById);
router.patch('/:id/read', protect, readNotification);
router.patch('/:id/hide', protect, hideNotification);

export default router;

