import express from 'express';
import { updateReport } from '../controllers/reportController.js';
import validate from '../middleware/validatin-mw.js';
import { updateReportSchema } from '../validation/report-schema.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect)


export default router;