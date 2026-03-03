'use strict';

import express from 'express';
import { createAppointment, updateAppointment, getAllAppointments, getAppointmentById } from '../controllers/appointment-controller.js';
import validate from '../middleware/validatin-mw.js';
import { createAppointmentSchema, updateAppointmentSchema } from '../validation/appointment-schema.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('super_admin', 'site_admin', 'company_admin', 'company_secretary'), getAllAppointments); // public
router.get('/:id', authorize('super_admin', 'site_admin', 'company_admin', 'company_secretary'), getAppointmentById); // public
router.post('/', authorize('super_admin', 'site_admin', 'company_admin', 'company_secretary'), validate(createAppointmentSchema), createAppointment);
router.patch('/:id', authorize('super_admin', 'site_admin', 'company_admin', 'company_secretary'), validate(updateAppointmentSchema), updateAppointment)

export default router;