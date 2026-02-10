import Joi from 'joi'
import { email, phones } from './global-schemas.js';

export const createCompanySchema = Joi.object({
    name: Joi.string().min(3).max(100).required()
        .messages({
            'string.empty': 'Title is required',
            'any.required': 'Title is required',
            'string.min': 'Title must be at least 3 characters long',
            'string.max': 'Title cannot exceed 100 characters'
        }),
    description: Joi.string().trim().required()
        .messages({
            'string.empy': 'Description must be a string',
            'any.required': 'Description is required',
            'string.max': 'Description cannot exceed 2000 characters'
        }),
    address: Joi.string().max(2000).required()
        .messages({
            'string.base': 'Address must be a string',
            'string.max': 'Address cannot exceed 2000 characters'
        }),
    lon: Joi.number().optional(),
    lat: Joi.number().optional(),
    fax: Joi.string().optional(),
    website: Joi.string().uri().required(),
    email,
    phones,
    socialMedia: Joi.array().items(Joi.object({
        platform: Joi.string().required(),
        url: Joi.string().uri().required()
    })).optional(),
    services: Joi.array().items(Joi.number().integer().positive()).min(1).required()
});

export const updateCompanySchema = createCompanySchema.fork(
    Object.keys(createCompanySchema.describe().keys),
    (schema) => schema.optional()
).min(1).unknown(false); 