import Joi from "joi";
import { name, birthdate, password, email, phones } from "./global-schemas.js";
import { locationSchema } from "./location-schema.js";

export const userBaseSchema = Joi.object({
    email,
    phones,
    name,
    password,
    birthdate,
    role: Joi.string()
        .valid(
        'super_admin',
        'site_admin',
        'company_admin',
        'company_secretary',
        'driver',
        'worker',
        'client'
        )
        .optional(),
    company_id: Joi.number()
        .integer()
        .optional(),
    locationSchema,
})