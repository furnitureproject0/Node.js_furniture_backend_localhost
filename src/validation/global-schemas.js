import Joi from "joi";

export const email = Joi
    .string()
    .trim()
    .email()
    .required()
    .messages({
        "string.email": "Please provide a valid email address",
        "string.empty": "Email is required",
        "any.required": "Email is required"
    });

export const phone = Joi.string()
    .trim()
    .pattern(/^\+?[1-9]\d{6,14}$/)
    .messages({
        "string.pattern.base": "Phone number must be in international format (e.g. +123456789)",
        "string.empty": "Phone number is required",
        "any.required": "Phone number is required"
    });

export const phones = Joi.array().items(phone);

export const birthdate = Joi.date().iso().less("now").messages({
    "date.format": "Birthdate must be in YYYY-MM-DD format",
    "date.less": "Birthdate must be a past date",
})

export const name = Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
        "string.base": "Name must be a text value",
        "string.empty": "Name is required",
        "string.min": "Name must be at least {#limit} characters long",
        "string.max": "Name must not be longer than {#limit} characters",
        "any.required": "Name is required"
    })

export const password = Joi.string()
    .trim()
    .min(8)
    .pattern(/[a-z]/, "lowercase letter")
    .pattern(/[A-Z]/, "uppercase letter")
    .pattern(/[0-9]/, "number")
    .pattern(/[^A-Za-z0-9]/, "special character")
    .required()
    .messages({
        "string.min": "Password must be at least {#limit} characters long",
        "string.empty": "Password is required",
        "any.required": "Password is required",
        "string.pattern.name": "Password must contain at least one {#name}"
    })

// Common filtering schema for pagination and sorting
export const commonFilterSchema = Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(10),
    sort: Joi.number().integer().valid(0, 1).optional().default(1), // 0 = ASC, 1 = DESC
    status: Joi.string().optional()
}).unknown(true); // Allow additional fields beyond the standard ones