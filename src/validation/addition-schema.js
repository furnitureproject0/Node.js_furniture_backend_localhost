import Joi from 'joi';

export const createAdditionSchema = Joi.object({
    name: Joi.string().required(),
});


export const updateAdditionSchema = createAdditionSchema.fork(
    Object.keys(createAdditionSchema.describe().keys),
    (schema) => schema.optional()
).min(1);