import express from 'express';
import { createClientByAdmin, updateClientByAdmin, getAllUsersByAdmin, deleteUserByAdmin, getAdminsBySuperAdmin } from '../controllers/user-controller.js';
import validate from '../middleware/validatin-mw.js';
import { userBaseSchema, updateUserSchema } from '../validation/user-schema.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get(
    '/admin/get-users', 
    protect, 
    authorize('super_admin'),
    getAllUsersByAdmin
);

router.get(
    '/super-admin/get-admins', 
    protect, 
    authorize('super_admin'),
    getAdminsBySuperAdmin
);

router.post(
    '/admin/create-user', 
    protect, 
    authorize('super_admin'),
    validate(userBaseSchema),
    createClientByAdmin
);

router.patch(
    '/admin/update-user/:id', 
    protect, 
    authorize('super_admin'),
    validate(updateUserSchema),
    updateClientByAdmin
);

router.delete(
    '/admin/delete-user/:id', 
    protect, 
    authorize('super_admin'),
    deleteUserByAdmin
);

export default router;