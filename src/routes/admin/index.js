import express from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import validate from '../../middleware/validatin-mw.js';

const router = express.Router();

router.use(protect);


export default router;
