import Joi from 'joi';

export const createReportSchema = Joi.object({
    numofHours: Joi.number()
        .positive()
        .required()
        .messages({
            'number.base': 'Number of hours must be a number',
            'number.positive': 'Number of hours must be positive',
            'any.required': 'Number of hours is required'
        }),
    paid_amount: Joi.number()
        .positive()
        .optional()
        .allow(null)
        .messages({
            'number.base': 'Paid amount must be a number',
            'number.positive': 'Paid amount must be positive'
        }),

    payment_method: Joi.string()
        .valid('cash', 'twint')
        .optional()
        .allow(null)
        .messages({
            'any.only': 'Payment method must be either cash or twint'
        }),

    notes: Joi.string()
        .optional(),

    // Employee hours array
    employee_hours: Joi.array()
        .items(
            Joi.object({
                employee_id: Joi.number()
                    .integer()
                    .positive()
                    .required()
                    .messages({
                        'number.base': 'Employee ID must be a number',
                        'number.positive': 'Employee ID must be positive',
                        'any.required': 'Employee ID is required'
                    }),
                hours: Joi.number()
                    .positive()
                    .required()
                    .messages({
                        'number.base': 'Hours must be a number',
                        'number.positive': 'Hours must be positive',
                        'any.required': 'Hours is required'
                    })
            })
        )
        .optional()
        .messages({
            'array.base': 'Employee hours must be an array'
        }),

    // Transactions/expenses array
    transactions: Joi.array()
        .items(
            Joi.object({
                payment_method: Joi.string()
                    .valid('cash', 'twint')
                    .required()
                    .messages({
                        'any.only': 'Payment method must be one of: cash, twint',
                        'any.required': 'Payment method is required'
                    }),
                name: Joi.string()
                    .max(255)
                    .required()
                    .messages({
                        'string.max': 'Transaction name cannot exceed 255 characters',
                        'any.required': 'Transaction name is required'
                    }),
                amount: Joi.number()
                    .precision(2)
                    .positive()
                    .required()
                    .messages({
                        'number.base': 'Amount must be a number',
                        'number.positive': 'Amount must be positive',
                        'any.required': 'Amount is required'
                    }),

                description: Joi.string()
                    .max(1000)
                    .optional()
                    .messages({
                        'string.max': 'Description cannot exceed 1000 characters'
                    })
            })
        )
        .optional()
        .messages({
            'array.base': 'Transactions must be an array'
        })
});

export const updateReportSchema = createReportSchema.fork(
    Object.keys(createReportSchema.describe().keys),
    schema => schema.optional()
);