import Joi from "joi";

export const locationSchema = Joi.object({
    type: Joi.string()
        .trim()
        .max(50)
        .optional()
        .allow(null),
    address: Joi.string()
        .trim()
        .max(255)
        .required()
        .messages({
            "string.base": "Address must be a text value",
            "string.empty": "Address is required",
            "string.max": "Address must not be longer than {#limit} characters",
            "any.required": "Address is required"
        }),
    country: Joi.string()
        .trim()
        .max(100)
        .optional()
        .allow(null),
    city: Joi.string()
        .trim()
        .max(100)
        .optional()
        .allow(null),
    zip_code: Joi.string()
        .trim()
        .max(20)
        .optional()
        .allow(null),
    lat: Joi.number()
        .min(-90)
        .max(90)
        .optional()
        .allow(null),
    lon: Joi.number()
        .min(-180)
        .max(180)
        .optional()
        .allow(null),
    area: Joi.number()
        .min(0)
        .optional()
        .allow(null),
    floor: Joi.number()
        .integer()
        .optional()
        .allow(null),
    number_of_floors: Joi.number()
        .integer()
        .optional()
        .allow(null),
    notes: Joi.string()
        .trim()
        .max(1000)
        .optional()
        .allow(null),
    rooms: Joi.number()
        .min(0)
        .precision(2)
        .optional()
        .allow(null),
    qualities: Joi.object()
        .optional()
        .allow(null)
})