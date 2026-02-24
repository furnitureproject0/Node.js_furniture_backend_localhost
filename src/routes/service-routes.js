import express from 'express';
import { getServices, createNewService, updateServiceById } from '../controllers/service-controller.js';
import validate from '../middleware/validatin-mw.js';
import { createServiceSchema, updateServiceSchema } from '../validation/service-schema.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, authorize('super_admin', 'site_admin', 'company_admin'), getServices);
router.post('/', protect, authorize('super_admin'), validate(createServiceSchema), createNewService);
router.patch('/:id', protect, authorize('super_admin'), validate(updateServiceSchema), updateServiceById);

export default router;