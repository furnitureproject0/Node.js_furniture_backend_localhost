import Joi from "joi";

export const createOfferSchema = Joi.object({
    hourly_rate: Joi.number()
        .precision(2)
        .positive()
        .required(),

    currency: Joi.string()
        .length(3)
        .uppercase()
        .optional(),

    min_hours: Joi.number()
        .positive()
        .required(),

    max_hours: Joi.number()
        .positive()
        .greater(Joi.ref("min_hours"))
        .required(),

    notes: Joi.string()
        .max(1000)
        .allow('')
        .optional()
});

export const updateOfferSchema = createOfferSchema.fork(
    Object.keys(createOfferSchema.describe().keys),
    field => field.optional()
).min(1);