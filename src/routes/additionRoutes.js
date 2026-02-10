import express from 'express';
import { getAllAdditions, getAdditionById, createAddition, updateAddition } from '../controllers/additionController.js';
import validate from '../middleware/validatin-mw.js';
import { createAdditionSchema, updateAdditionSchema } from '../validation/addition-schema.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllAdditions); // public
router.get('/:id', getAdditionById); // public
router.post('/', protect, authorize('super_admin'), validate(createAdditionSchema), createAddition);
router.patch('/:id', protect, authorize('super_admin'), validate(updateAdditionSchema), updateAddition)

export default router;