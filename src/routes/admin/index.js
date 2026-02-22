import express from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import siteAdminRoutes from './coreAdminRoutes.js';

const router = express.Router();

router.use(protect);

// site-admin routes accessible by site admins, company admins, and company secretaries
router.use('/site-admin', authorize('site_admin', 'company_admin', 'company_secretary'), siteAdminRoutes);

export default router;
