import express from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import validate from '../../middleware/validatin-mw.js';

const router = express.Router();

router.use(protect);

router.get('/search-clients', authorize('company_admin', 'company_secretary', 'site_admin'), validate(searchClientsSchema), searchClients);

export default router;
