import Joi from "joi";
import { email } from "./global-schemas.js";
import { userBaseSchema } from "./user-schema.js";

export const registerSchema = userBaseSchema;
export const companyCreateClientSchema = userBaseSchema.fork(['password', 'birthdate'], (schema) => schema.forbidden());

export const loginSchema = Joi.object({
    email,
    password: Joi
        .string()
        .required()
        .messages({
            "string.empty": "Password is required",
            "any.required": "Password is required"
        })
});

export const verifyEmailSchema = Joi.object({
    otp: Joi
        .string()
        .length(6)
        .pattern(/^[0-9]+$/)
        .required()
        .messages({
            "string.empty": "Verification code is required",
            "string.length": "Verification code must be 6 digits",
            "string.pattern.base": "Verification code must contain only numbers",
            "any.required": "Verification code is required"
        })
});

export const forgotPasswordSchema = Joi.object({
    email
});

export const resetPasswordSchema = Joi.object({
    email,
    otp: Joi
        .string()
        .length(6)
        .pattern(/^[0-9]+$/)
        .required()
        .messages({
            "string.length": "Code must be 6 digits",
            "string.pattern.base": "Code must contain only numbers",
        }),

    new_password: Joi.string()
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
        }),
});