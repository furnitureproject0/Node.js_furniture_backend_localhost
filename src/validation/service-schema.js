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
        })
});

export const updateServiceSchema = createServiceSchema.fork(
    Object.keys(createServiceSchema.describe().keys),
    (schema) => schema.optional()
).min(1);