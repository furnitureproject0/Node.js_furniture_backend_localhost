import express from 'express';
import { getOrders, adminCreateOrderForClient, adminUpdateOrderForClient, cancelOrderByAdmin, getOrderDetails, downloadOrderPDF } from '../controllers/order-controller.js';
import validate from '../middleware/validatin-mw.js';
import { createOrderForClientSchema, updateOrderForClientSchema } from '../validation/order-schema.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('super_admin', 'site_admin', 'company_admin'), getOrders);
router.get('/:id', authorize('super_admin', 'site_admin', 'company_admin', 'company_secretary'), getOrderDetails);
router.post('/admin-create-order', authorize('super_admin', 'site_admin', 'company_admin', 'company_secretary'), validate(createOrderForClientSchema), adminCreateOrderForClient);
router.patch('/admin-update-order/:id', authorize('super_admin', 'site_admin', 'company_admin', 'company_secretary'), validate(updateOrderForClientSchema), adminUpdateOrderForClient);
router.patch('/:id/cancel', authorize('super_admin', 'site_admin', 'company_admin', 'company_secretary'), cancelOrderByAdmin);
router.get('/:id/pdf', authorize('super_admin', 'site_admin', 'company_admin', 'company_secretary'),downloadOrderPDF);

export default router;