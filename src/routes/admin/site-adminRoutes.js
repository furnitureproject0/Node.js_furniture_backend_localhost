import express from 'express';

import validate from '../../middleware/validatin-mw.js';

const router = express.Router();

router.use('/search-clients', validate(searchClientsSchema), searchClients);

export default router;
