'use strict';

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validatin-mw.js';
import { createVehicleSchema, updateVehicleSchema } from '../validation/vehicle.schema.js';
import { createVehicle, editVehicle, removeVehicle } from '../controllers/vehicle-controller.js';

const router = express.Router();

router.use(protect);
router.use(authorize('super_admin', 'site_admin', 'company_admin'));

router.post('/add', validate(createVehicleSchema), createVehicle);
router.patch('/edit/:id', validate(updateVehicleSchema), editVehicle);
router.delete('/delete/:id', removeVehicle);

export default router;