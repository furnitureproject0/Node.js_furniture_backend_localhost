'use strict';

import Joi from 'joi';

export const createVehicleSchema = Joi.object({
    name: Joi.string()
        .trim()
        .max(255)
        .required()
        .messages({
            'string.base': 'Vehicle name must be a string',
            'string.empty': 'Vehicle name cannot be empty',
            'string.max': 'Vehicle name cannot exceed 255 characters',
            'any.required': 'Vehicle name is required'
        }),
    type: Joi.string()
        .valid('car', 'truck', 'van', 'motorcycle', 'trailer', 'lift', 'other').default('truck')
        .optional()
        .messages({
            'any.only': 'Vehicle type must be one of: car, truck, van, motorcycle, trailer, lift, other'
        }),
    license_plate: Joi.string()
        .trim()
        .max(20)
        .required()
        .messages({
            'string.base': 'License plate must be a string',
            'string.empty': 'License plate cannot be empty',
            'string.max': 'License plate cannot exceed 20 characters',
            'any.required': 'License plate is required'
        }),
    company_id: Joi.number()
        .integer()
        .optional()
        .allow(null)
        .messages({
            'number.base': 'Company ID must be a number',
            'number.integer': 'Company ID must be an integer'
        }),
    manufacturer: Joi.string()
        .trim()
        .max(255)
        .optional()
        .allow(null, '')
        .messages({
            'string.base': 'Manufacturer must be a string',
            'string.max': 'Manufacturer cannot exceed 255 characters'
        }),
    model: Joi.string()
        .trim()
        .max(255)
        .optional()
        .allow(null, '')
        .messages({
            'string.base': 'Model must be a string',
            'string.max': 'Model cannot exceed 255 characters'
        }),
    passenger_seats: Joi.number()
        .integer()
        .min(0)
        .optional()
        .default(2)
        .messages({
            'number.base': 'Passenger seats must be a number',
            'number.integer': 'Passenger seats must be an integer',
            'number.min': 'Passenger seats cannot be negative'
        }),
    volume_capacity: Joi.number()
        .positive()
        .precision(2)
        .optional()
        .allow(null)
        .messages({
            'number.base': 'Volume capacity must be a number',
            'number.positive': 'Volume capacity must be positive'
        }),
    weight_capacity: Joi.number()
        .positive()
        .precision(2)
        .optional()
        .allow(null)
        .messages({
            'number.base': 'Weight capacity must be a number',
            'number.positive': 'Weight capacity must be positive'
        }),
    height: Joi.number()
        .positive()
        .precision(2)
        .optional()
        .allow(null)
        .messages({
            'number.base': 'Height must be a number',
            'number.positive': 'Height must be positive'
        }),
    width: Joi.number()
        .positive()
        .precision(2)
        .optional()
        .allow(null)
        .messages({
            'number.base': 'Width must be a number',
            'number.positive': 'Width must be positive'
        }),
    length: Joi.number()
        .positive()
        .precision(2)
        .optional()
        .allow(null)
        .messages({
            'number.base': 'Length must be a number',
            'number.positive': 'Length must be positive'
        }),
    status: Joi.string()
        .valid('active', 'maintenance', 'inactive').default('active'),
    image_url: Joi.string()
        .uri()
        .optional()
        .allow(null, '')
        .messages({
            'string.base': 'Image URL must be a string',
            'string.uri': 'Image URL must be a valid URI',
        }),
    notes: Joi.string()
        .optional()
        .allow(null, '')
        .messages({
            'string.base': 'Notes must be a string',
        }),
});

export const updateVehicleSchema = createVehicleSchema.fork(
    ['name', 'type', 'license_plate', 'company_id', 'manufacturer', 'model', 'passenger_seats', 'volume_capacity', 'weight_capacity', 'height', 'width', 'length', 'status', 'image_url', 'notes'],
    schema => schema.optional()
).min(1);