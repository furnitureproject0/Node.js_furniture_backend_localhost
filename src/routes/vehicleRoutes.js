'use strict';

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validatin-mw.js';
import { createVehicleSchema } from '../validation/vehicle.schema.js';
import { createVehicle } from '../controllers/vehicleController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('super_admin', 'site_admin', 'company_admin'));

router.post('/add', validate(createVehicleSchema), createVehicle);

export default router;