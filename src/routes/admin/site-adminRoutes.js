import express from 'express';

import { searchClientsSchema } from '../../validation/site.company.admin-schema.js';
import { userBaseSchema, updateUserSchema } from '../../validation/user-schema.js';
import validate from '../../middleware/validatin-mw.js';
import { searchClients, createClient, updateClient } from '../../controllers/admin/site-admin.controller.js';

const router = express.Router();

router.get('/search-clients', validate(searchClientsSchema), searchClients);
router.post('/add-client', validate(userBaseSchema), createClient);
router.patch('/update-client/:id', validate(updateUserSchema), updateClient);

export default router;
