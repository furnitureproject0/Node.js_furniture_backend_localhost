import Joi from 'joi';
import { email } from './global-schemas.js';
import { createOfferSchema } from './offer-schema.js';

const orderServicesSchema = Joi.array().items(
    Joi.object({
        service_id: Joi.number().integer().required(),
        pricing_type: Joi.string().valid('per_hour', 'per_square_meter', 'per_cubic_meter', 'per_quantity', 'per_room', 'flat_rate', 'max_price', 'custom').optional(),
        price_per_unit: Joi.number().precision(2).min(0).optional(), // Changed to min(0) to allow free if needed
        fixed_price: Joi.number().precision(2).min(0).optional(), // 👈 Added for Hybrid/Flat pricing
        minimum_charge: Joi.number().precision(2).min(0).optional(),
        total_price: Joi.number().precision(2).min(0).optional(),
        min_total_price: Joi.number().precision(2).min(0).optional(), // 👈 Added
        max_total_price: Joi.number().precision(2).min(0).optional(), // 👈 Added
        details: Joi.object().optional().default({}),
        company_id: Joi.number().integer().optional(),
        min_units: Joi.number().min(0).optional(), // Changed to number (not integer) for 0.5 hours etc.
        max_units: Joi.number().min(0).optional(), 

        additions: Joi.array().items(
            Joi.object({
                addition_id: Joi.number().integer().required(),
                pricing_type: Joi.string().valid('per_hour', 'per_square_meter', 'per_cubic_meter', 'per_quantity', 'per_room', 'flat_rate', 'max_price', 'custom').optional(),
                price_per_unit: Joi.number().precision(2).min(0).optional(),
                fixed_price: Joi.number().precision(2).min(0).optional(), // 👈 Added
                minimum_charge: Joi.number().precision(2).min(0).optional(),
                total_price: Joi.number().precision(2).min(0).optional(),
                min_total_price: Joi.number().precision(2).min(0).optional(), // 👈 Added
                max_total_price: Joi.number().precision(2).min(0).optional(), // 👈 Added
                details: Joi.object().optional().default({}),
                min_units: Joi.number().min(0).optional(),
                max_units: Joi.number().min(0).optional(), 
                note: Joi.string().allow('', null).optional() // 👈 Simplified this to avoid the "required" error you saw
            })
        ).allow(null).optional(),
    })
);


export const locationSchema = Joi.object({
    address: Joi.string().max(255).required(),
    type: Joi.string().allow('').optional(),
    floor: Joi.number().integer().allow(null).optional(),
    area: Joi.number().min(0).allow(null, '').optional(),
    num_of_floors: Joi.number().integer().allow(null).optional(),
    has_elevator: Joi.boolean().optional().default(false),
    latitude: Joi.number().precision(8).allow(null).optional(),
    longitude: Joi.number().precision(8).allow(null).optional(),
    notes: Joi.string().allow('').max(1000).optional(),
    qualities: Joi.object().optional().default({})
});

export const orderBaseSchema = Joi.object({
    company_id: Joi.number().integer().required(),
    execution_date: Joi.date().required(),
    execution_time: Joi.string().required(),
    primary_location: locationSchema.required(),
    secondary_location: locationSchema.optional(),
    number_of_rooms: Joi.number().allow(null, '').optional(),
    rooms: Joi.any().allow(null).optional(),
    notes: Joi.string().allow('').max(1000).optional(),
    
    // 👈 Added timeline fields
    timelineMessage: Joi.string().optional(),
    timelineStatus: Joi.string().optional(),

    vehicles: Joi.array().items(
        Joi.object({
            id: Joi.number().integer().optional(),
            license_plate: Joi.string().trim().max(31).optional()
        })
    ).optional(),
});

export const createOrderSchema = orderBaseSchema.keys(
    {
        services: orderServicesSchema.min(1).required()
    }
)

export const updateOrderSchema = createOrderSchema.fork(
    Object.keys(createOrderSchema.describe().keys),
    (schema) => schema.optional()
).min(1);

// Schema for company admin creating orders for clients
export const createOrderForClientSchema = createOrderSchema.keys({
    email
});

export const updateOrderForClientSchema = createOrderForClientSchema.fork(
    Object.keys(createOrderForClientSchema.describe().keys),
    (schema) => schema.optional()
).min(1);


export const createOrderAsSiteAdminschema = createOrderSchema.keys({
    email,
    order_type: Joi.string().valid('order', 'offer').optional(),
    services: Joi.array().items(
        Joi.object({
            service_id: Joi.number().integer().required(),
            company_id: Joi.number().integer().optional(),
            offer: createOfferSchema.optional(),
            additions: Joi.array().items(
                Joi.object({
                    addition_id: Joi.number().integer().required(),
                    quantity: Joi.number().integer().min(1).optional(),
                    price: Joi.number().precision(2).positive().optional(),
                    note: Joi.when('addition_id', {
                        is: 1,
                        then: Joi.string().required(),
                        otherwise: Joi.string().allow('').optional()
                    })
                })
            ).allow(null).empty().optional(),
        })
    )
});

