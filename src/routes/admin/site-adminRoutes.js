import express from 'express';

import { searchClientsSchema } from '../../validation/site.company.admin-schema.js';
import validate from '../../middleware/validatin-mw.js';
import { searchClients } from '../../controllers/admin/site-admin.controller.js';

const router = express.Router();

router.get('/search-clients', validate(searchClientsSchema), searchClients);

export default router;
