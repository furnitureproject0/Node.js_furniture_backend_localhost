import Joi from "joi";

export const userCompanySchema = Joi.object({
  assignments: Joi.array()
    .items(
      Joi.object({
        company_id: Joi.number().integer().positive().required(),
        type: Joi.string().valid('internal', 'external').required()
      })
    )
    .min(1)
    .required()
});

export const userCompanyUpdateSchema = userCompanySchema.fork(
    Object.keys(userCompanySchema.describe().keys),
        field => field.optional()
    ).min(1);
