import Joi from 'joi';
import { name, email, birthdate, phones } from './global-schemas.js';

const companyEmployee = Joi.object({
    email,
    phones,
    name,
    birthdate,
})

export const
    createCompanyAdminSchema = companyEmployee;

export const updateCompanyAdminSchema = createCompanyAdminSchema.fork(
    Object.keys(createCompanyAdminSchema.describe().keys),
    (schema) => schema.optional()
).min(1);

export const createCompanyEmployeeSchema = companyEmployee.keys({
    role: Joi.string().valid('company_secretary', 'driver', 'worker').required(),

    // Conditional fields based on role
    hourly_rate: Joi.when('role', {
        is: Joi.valid('worker', 'driver'),
        then: Joi.number().positive().required(),
        otherwise: Joi.forbidden(),
    }),

    currency: Joi.when('role', {
        is: Joi.valid('worker', 'driver'),
        then: Joi.string().optional(),
        otherwise: Joi.forbidden(),
    }),

    start_date: Joi.date().iso().optional(),
    // end_date: Joi.date().iso().min(Joi.ref('start_date')).optional(),
});

export const employmentSchema = Joi.object({
    email,
    hourly_rate: Joi.number().positive(),
    currency: Joi.string().optional(),
    start_date: Joi.date().iso().optional(),
    // end_date: Joi.date().iso().min(Joi.ref('start_date')).optional(),
})

export const updateEmploymentSchema = Joi.object({
    hourly_rate: Joi.number().positive().optional(),
    currency: Joi.string().optional(),
    start_date: Joi.date().iso().optional(),
})

export const getCompanyDashboardSchema = Joi.object({
    start_date: Joi.date().iso().optional(),
    end_date: Joi.date().iso().optional(),
    points: Joi.number().optional(),
})

export const checkClientEmailSchema = Joi.object({
    email
})