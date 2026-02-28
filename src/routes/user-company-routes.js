import express from 'express';
import { assignCompaniesToAdmin, removeCompanyFromAdmin, getAdminCompanies } from '../controllers/user-company-controller.js';
import validate from '../middleware/validatin-mw.js';
import { userCompanySchema, userCompanyUpdateSchema } from '../validation/user-company-schema.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('super_admin'));

router.post('/assign-companies/:id', authorize('super_admin'), validate(userCompanySchema), assignCompaniesToAdmin);
router.patch('/assign-companies/:id', authorize('super_admin'), validate(userCompanyUpdateSchema), assignCompaniesToAdmin);
router.delete('/remove-company/:id/:companyId', authorize('super_admin'), removeCompanyFromAdmin);
router.get(
    '/:id/companies', 
    authorize('super_admin', 'site_admin', 'company_admin', 'company_secretary'),
    getAdminCompanies
);

export default router;