import Joi from 'joi';

export const createAdditionSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  requirements: Joi.object().optional(),
  pricing_type: Joi.string()
    .valid(
      'per_hour',
      'per_square_meter',
      'per_cubic_meter',
      'per_quantity',
      'per_room',
      'flat_rate',
      'max_price',
      'custom'
    )
    .optional(),
  price_per_unit: Joi.number().precision(2).positive().optional(),
  min_units: Joi.number().positive().optional(),
  max_units: Joi.number().positive().optional(),
  minimum_charge: Joi.number().precision(2).positive().optional(),
  is_active: Joi.boolean().optional()
});


export const updateAdditionSchema = createAdditionSchema.fork(
    Object.keys(createAdditionSchema.describe().keys),
    (schema) => schema.optional()
).min(1);