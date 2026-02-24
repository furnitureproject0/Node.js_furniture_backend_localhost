import express from 'express';
import { getAdditions, createNewAddition, updateAdditionById } from '../controllers/addition-controller.js';
import validate from '../middleware/validatin-mw.js';
import { createAdditionSchema, updateAdditionSchema } from '../validation/addition-schema.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, authorize('super_admin'), getAdditions);
router.post('/', protect, authorize('super_admin'), validate(createAdditionSchema), createNewAddition);
router.patch('/:id', protect, authorize('super_admin'), validate(updateAdditionSchema), updateAdditionById);

export default router;