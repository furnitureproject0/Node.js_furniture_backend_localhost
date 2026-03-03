import Joi from 'joi';

export const createAppointmentSchema = Joi.object({
    company_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            "number.base": "Company ID must be a number",
            "any.required": "Company ID is required"
        }),
    client_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            "number.base": "Client ID must be a number",
            "any.required": "Client ID is required"
        }),
    order_id: Joi.number()
        .integer()
        .positive()
        .optional()
        .allow(null),
    expected_date: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .required()
        .messages({
            "string.pattern.base": "Expected date must be in YYYY-MM-DD format",
            "any.required": "Expected date is required"
        }),
    expected_time: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
        .required()
        .messages({
            "string.pattern.base": "Expected time must be in HH:mm or HH:mm:ss format",
            "any.required": "Expected time is required"
        }),
    notes: Joi.string()
        .trim()
        .max(1000)
        .optional()
        .allow(null, ''),
    status: Joi.string()
        .valid('pending', 'confirmed', 'completed', 'cancelled')
        .optional()
});

// For update, make all fields optional
export const updateAppointmentSchema = createAppointmentSchema.fork(
    Object.keys(createAppointmentSchema.describe().keys),
        (schema) => schema.optional()
    ).min(1)