import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
    getMyAssignments,
    acceptAssignment,
    rejectAssignment,
} from '../controllers/employeeOrderController.js';
import {
    getMyEmployments,
    acceptEmployment,
    rejectEmployment
} from '../controllers/employmentController.js';

const router = express.Router();

router.use(protect, authorize('worker', 'driver'));

// Assignment management routes
router.get('/assignments', getMyAssignments);
router.patch('/offers/:offerId/accept', acceptAssignment);
router.patch('/offers/:offerId/reject', rejectAssignment);

// Employment management routes
router.get('/employments', getMyEmployments);
router.patch('/employments/:employmentId/accept', acceptEmployment);
router.patch('/employments/:employmentId/reject', rejectEmployment);

export default router;