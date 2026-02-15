import Joi from "joi";

export const searchClientsSchema = Joi.object({
    search: Joi.string()
        .trim()
        .min(1)
        .max(200)
        .optional()
        .messages({
            'string.base': 'Search value must be a string',
            'string.empty': 'Search value cannot be empty',
            'string.min': 'Search value must be at least 1 character long',
            'string.max': 'Search value cannot exceed 200 characters'
        })
}); 