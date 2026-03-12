import * as Joi from "joi";

export const createAttributeSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  slug: Joi.string().min(2).max(50).required(),
  values: Joi.array().items(Joi.string().min(1)).required()
});

export const updateAttributeSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  slug: Joi.string().min(2).max(50),
  values: Joi.array().items(Joi.string().min(1))
});