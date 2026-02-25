import Joi from 'joi';
import { email } from './global-schemas.js';
import { createOfferSchema } from './offer-schema.js';

const orderServicesSchema = Joi.array().items(
    Joi.object({
        service_id: Joi.number().integer().required(),
        additions: Joi.array().items(
            Joi.object({
                addition_id: Joi.number().integer().required(),
                note: Joi.when('addition_id', {
                    is: 1,
                    then: Joi.string().required(),
                    otherwise: Joi.string().allow('').optional()
                })
            })
        ).allow(null).empty().optional(),
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
    preferred_date: Joi.date().required(),
    preferred_time: Joi.string().required(),
    primary_location_id: locationSchema.required(),
    secondary_location_id: locationSchema.optional(),
    number_of_rooms: Joi.number().allow(null, '').optional(),
    rooms: Joi.any().allow(null).optional(),
    notes: Joi.string().allow('').max(1000).optional()
});

export const createOrderSchema = orderBaseSchema.keys(
    {
        services: orderServicesSchema.min(1)
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

