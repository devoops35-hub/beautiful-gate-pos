/**
 * Settings Validation Schemas
 * Validates settings update requests
 */

const Joi = require('joi');
const { validateRequest } = require('../middleware/authMiddleware');

// Update setting validation schema
const updateSettingSchema = Joi.object({
  value: Joi.alternatives()
    .try(
      Joi.string().required(),
      Joi.number().required(),
      Joi.boolean().required()
    )
    .messages({
      'any.required': 'Value is required',
    }),
}).unknown(false);

// Middleware wrapper
const validateUpdateSettings = validateRequest(updateSettingSchema);

module.exports = {
  updateSettingSchema,
  validateUpdateSettings,
};
