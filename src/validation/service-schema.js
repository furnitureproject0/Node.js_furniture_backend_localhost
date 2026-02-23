import Joi from 'joi';

export const createServiceSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(100).required()
        .messages({
            'string.empty': 'Service name is required',
            'string.min': 'Service name must be at least 3 characters long',
            'string.max': 'Service name cannot exceed 100 characters'
        }),
    description: Joi.string()
        .trim()
        .optional()
        .messages({
            'string.base': 'Description must be a string'
        }),
    additions: Joi.array()
        .items(Joi.number().integer().positive())
        .unique()
        .optional()
        .messages({
            'array.unique': 'Duplicate addition IDs are not allowed',
            'number.base': 'Addition ID must be a number',
            'number.integer': 'Addition ID must be an integer',
            'number.positive': 'Addition ID must be positive'
        }),
    requirements: Joi.object()
        .required()
        .messages({
            'object.base': 'Requirements must be an object',
            'any.required': 'Service requirements are required'
        }),
    pricing_type: Joi.string()
        .valid('per_hour', 'per_square_meter', 'per_cubic_meter', 'per_quantity', 'per_room', 'flat_rate', 'max_price', 'custom')
        .optional()
        .messages({
            'string.base': 'Pricing type must be a string',
            'any.only': 'Invalid pricing type'
        }),
    price_per_unit: Joi.number()
        .precision(2)
        .positive()
        .optional()
        .messages({
            'number.base': 'Price per unit must be a number',
            'number.positive': 'Price per unit must be positive',
            'number.precision': 'Price per unit can have up to 2 decimal places'
        }),
    min_units: Joi.number()
        .positive()
        .optional()
        .messages({
            'number.base': 'Minimum units must be a number',
            'number.positive': 'Minimum units must be positive'
        }),
    max_units: Joi.number()
        .positive()
        .optional()
        .messages({
            'number.base': 'Maximum units must be a number',
            'number.positive': 'Maximum units must be positive'
        }),
    minimum_charge: Joi.number()
        .precision(2)
        .positive()
        .optional()
        .messages({
            'number.base': 'Minimum charge must be a number',
            'number.positive': 'Minimum charge must be positive',
            'number.precision': 'Minimum charge can have up to 2 decimal places'
        }),
    discount: Joi.number()
        .precision(2)
        .min(0)
        .optional()
        .messages({
            'number.base': 'Discount must be a number',
            'number.min': 'Discount cannot be negative',
            'number.precision': 'Discount can have up to 2 decimal places'
        }),
    is_active: Joi.boolean()
        .optional()
        .messages({
            'boolean.base': 'is_active must be a boolean'
        })
});

export const updateServiceSchema = createServiceSchema.fork(
    Object.keys(createServiceSchema.describe().keys),
    (schema) => schema.optional()
).min(1);