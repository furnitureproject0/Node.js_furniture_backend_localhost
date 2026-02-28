import express from 'express';
import { getMyNotifications } from '../controllers/notification-controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get(
    '/', 
    getMyNotifications
);

export default router;