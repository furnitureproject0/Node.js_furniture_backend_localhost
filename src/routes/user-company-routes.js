import express from 'express';
import { assignCompaniesToAdmin } from '../controllers/user-company-controller.js';
import validate from '../middleware/validatin-mw.js';
import { userCompanySchema, userCompanyUpdateSchema } from '../validation/user-company-schema.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('super_admin'));

router.post('/assign-companies/:id', validate(userCompanySchema), assignCompaniesToAdmin);
router.patch('/assign-companies/:id', validate(userCompanyUpdateSchema), assignCompaniesToAdmin);

export default router;