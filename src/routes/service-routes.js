import express from 'express';
import { getServices, createNewService, updateServiceById, activeServiceById, deactiveServiceById, trashServiceById, retrieveServiceById, deleteServiceById } from '../controllers/service-controller.js';
import validate from '../middleware/validatin-mw.js';
import { createServiceSchema, updateServiceSchema } from '../validation/service-schema.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, authorize('super_admin', 'site_admin', 'company_admin'), getServices);
router.post('/', protect, authorize('super_admin'), validate(createServiceSchema), createNewService);
router.get('/active/:id', protect, authorize('super_admin', 'site_admin', 'company_admin'), activeServiceById);
router.get('/de-active/:id', protect, authorize('super_admin', 'site_admin', 'company_admin'), deactiveServiceById);
router.get('/trash/:id', protect, authorize('super_admin', 'site_admin', 'company_admin'), trashServiceById);
router.get('/retrieve/:id', protect, authorize('super_admin'), retrieveServiceById);
router.patch('/:id', protect, authorize('super_admin'), validate(updateServiceSchema), updateServiceById);
router.delete('/:id', protect, authorize('super_admin'), deleteServiceById);

export default router;