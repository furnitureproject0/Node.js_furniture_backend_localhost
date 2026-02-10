import express from 'express';
import {
    getAllServices,
    getServiceById,
    createService,
    updateService,
} from '../controllers/serviceController.js';
import { protect, authorize } from '../middleware/auth.js'
import validate from '../middleware/validatin-mw.js';
import { createServiceSchema, updateServiceSchema } from '../validation/service-schema.js';

const router = express.Router();

router.get('', getAllServices);
router.get('/:id', getServiceById);
router.post('', protect, authorize('super_admin'), validate(createServiceSchema), createService);
router.patch('/:id', protect, authorize('super_admin'), validate(updateServiceSchema), updateService);

export default router;