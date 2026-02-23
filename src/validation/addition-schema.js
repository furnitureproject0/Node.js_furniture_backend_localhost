import Joi from 'joi';

export const createAdditionSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    requirements: Joi.object().required(),
    price: Joi.number().precision(2).positive().optional(),
    is_active: Joi.boolean().optional()
});


export const updateAdditionSchema = createAdditionSchema.fork(
    Object.keys(createAdditionSchema.describe().keys),
    (schema) => schema.optional()
).min(1);