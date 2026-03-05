import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
    createOrderAsSiteAdmin,
    convertToOrder
} from '../controllers/siteAdminOrderController.js';
import validate from '../middleware/validatin-mw.js';
import { createOrderAsSiteAdminschema } from '../validation/order-schema.js';
import { upload } from '../middleware/upload.js';
import { parseMultipartFields } from '../middleware/parse-multipart.js';

const router = express.Router();

router.use(protect);

// Create order as site admin
router.post(
    '/orders',
    authorize('site_admin'),
    upload.array('images', 10),
    parseMultipartFields,
    validate(createOrderAsSiteAdminschema),
    createOrderAsSiteAdmin
);

// Convert offer/appointment to order
router.patch(
    '/company-orders/:id/convert-to-order',
    authorize('site_admin', 'company_admin', 'company_secretary'),
    convertToOrder
);

export default router;
