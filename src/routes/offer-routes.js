import express from 'express';
import { getOffers, adminCreateOfferForClient, adminUpdateOffer, cancelOfferByAdmin } from '../controllers/offer-controller.js';
import validate from '../middleware/validatin-mw.js';
import { createOrderForClientSchema, updateOrderForClientSchema } from '../validation/order-schema.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('super_admin', 'site_admin', 'company_admin', 'company_secretary'), getOffers);
router.post('/admin-create-offer', authorize('super_admin', 'site_admin', 'company_admin', 'company_secretary'), validate(createOrderForClientSchema), adminCreateOfferForClient);
router.patch('/admin-update-offer/:id', authorize('super_admin', 'site_admin', 'company_admin', 'company_secretary'), validate(updateOrderForClientSchema), adminUpdateOffer);
router.patch('/:id/cancel', authorize('super_admin', 'site_admin', 'company_admin', 'company_secretary'), cancelOfferByAdmin);

export default router;