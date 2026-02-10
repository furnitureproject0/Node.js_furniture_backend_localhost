import express from 'express';
import {
    acceptOffer,
    rejectOffer,
    cancelOffer
} from '../controllers/offerController.js';
import { protect, authorize } from '../middleware/auth.js';
import {
    assignEmployeeToOffer,
    revokeAssignment,
    getOfferAssignments,
    makeLeader
} from '../controllers/companyAdminOfferController.js'

const router = express.Router();

router.use(protect);

// TODO: get all offers, get offer by id
// Routes accessible by both company admins and clients
// router.get('/:offerId', getOfferById);

// Client routes - accept/reject offers
router.patch(
    '/:offerId/accept',
    authorize('client'),
    acceptOffer
);

router.patch(
    '/:offerId/reject',
    authorize('client'),
    rejectOffer
);

// company admin and company secretary offer routes
router.patch(
    '/:offerId/cancel',
    authorize('company_admin', 'company_secretary'),
    cancelOffer
);

router.post(
    '/:offerId/assignments',
    authorize('company_admin', 'company_secretary'),
    assignEmployeeToOffer
);

router.patch(
    '/:offerId/assignments/:assignmentId/cancel',
    authorize('company_admin', 'company_secretary'),
    revokeAssignment
);

router.get(
    '/:offerId/assignments',
    authorize('company_admin', 'company_secretary'),
    getOfferAssignments
);

router.patch(
    '/:offerId/employees/:employeeId/make-leader',
    authorize('company_admin'),
    makeLeader
);

export default router;
