import express from 'express';
import {
    getAllCompanies,
    getCompanyById,
    createCompany,
    updateCompany,
    suspendCompany,
    activateCompany,
    getCompanyDashboard
} from '../controllers/companyController.js';
import {
    getCompanyAdmin,
    createCompanyAdmin,
    getCompanyEmployees,
    addCompanyEmployee,
    updateCompanyAdmin,
    updateEmployment,
    createEmployment,
    terminateEmployment,
    cancelEmployment,
    createCompanyClient,
    createOrderForClient,
    checkClientEmail,
} from '../controllers/companyEmployeeController.js';
import { protect, authorize } from '../middleware/auth.js';
import {
    createCompanySchema,
    updateCompanySchema,
} from '../validation/company-schema.js';
import validate from '../middleware/validatin-mw.js';
import { upload } from '../middleware/upload.js';
import { parseMultipartFields } from '../middleware/parse-multipart.js';
import { createCompanyAdminSchema, createCompanyEmployeeSchema, updateCompanyAdminSchema, employmentSchema, updateEmploymentSchema, checkClientEmailSchema } from '../validation/company-employee-schema.js';
import { companyCreateClientSchema } from '../validation/auth-schema.js';
import { createOrderForClientSchema } from '../validation/order-schema.js';

const router = express.Router();

// Company base routes
router.get('/', getAllCompanies); // public 
router.get('/:id', getCompanyById); // public

// Check if email belongs to a registered client (must be before /:id routes)
router.post(
    '/clients/check-email',
    protect,
    authorize('company_admin', 'company_secretary', 'site_admin'),
    validate(checkClientEmailSchema),
    checkClientEmail
);

router.post(
    '/',
    protect,
    authorize('super_admin'),
    upload.single('logo'),
    parseMultipartFields,
    validate(createCompanySchema),
    createCompany
);

router.patch(
    '/:id',
    protect,
    authorize('super_admin', 'company_admin'),
    upload.single('logo'),
    parseMultipartFields,
    validate(updateCompanySchema),
    updateCompany
);

// Company admin routes
router.get(
    '/:id/admin',
    protect,
    authorize('super_admin'),
    getCompanyAdmin
);

router.post(
    '/:id/admin',
    protect,
    authorize('super_admin'),
    validate(createCompanyAdminSchema),
    createCompanyAdmin
);

router.patch(
    '/:id/admin',
    protect,
    authorize('super_admin'),
    validate(updateCompanyAdminSchema),
    updateCompanyAdmin
);

// Company employees routes (workers, drivers, secretaries)
router.get(
    '/:id/employees',
    protect,
    authorize('company_admin', 'company_secretary'),
    getCompanyEmployees
);

router.post(
    '/:id/employees',
    protect,
    authorize('company_admin'),
    validate(createCompanyEmployeeSchema),
    addCompanyEmployee
);


router.post(
    '/:id/clients',
    protect,
    authorize('company_admin', 'company_secretary', 'site_admin'),
    validate(companyCreateClientSchema),
    createCompanyClient
);

// Create order for a client (by company_admin)
router.post(
    '/:id/orders',
    protect,
    authorize('company_admin'),
    upload.array('images', 10),
    parseMultipartFields,
    validate(createOrderForClientSchema),
    createOrderForClient
);

// Update an employment record (status, rate, dates)
router.patch(
    '/:id/employments/:employmentId',
    protect,
    authorize('company_admin', 'super_admin'),
    validate(updateEmploymentSchema),
    updateEmployment
);

// Create employment for existing user
router.post(
    '/:id/employments',
    protect,
    authorize('company_admin'),
    validate(employmentSchema),
    createEmployment
);

// Terminate employment
router.patch(
    '/:id/employments/:employmentId/terminate',
    protect,
    authorize('company_admin', 'super_admin'),
    terminateEmployment
);

// Cancel employment (only pending)
router.patch(
    '/:id/employments/:employmentId/cancel',
    protect,
    authorize('company_admin', 'super_admin'),
    cancelEmployment
);

// Suspend company (super_admin only)
router.patch(
    '/:id/suspend',
    protect,
    authorize('super_admin'),
    suspendCompany
);

// Activate company (super_admin only)
router.patch(
    '/:id/activate',
    protect,
    authorize('super_admin'),
    activateCompany
);


// Company dashboard - financial data
router.get(
    '/:id/dashboard',
    protect,
    authorize('company_admin'),

    getCompanyDashboard
);

export default router;