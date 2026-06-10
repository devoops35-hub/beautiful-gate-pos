/**
 * Authentication Validation Schemas
 * Validates user registration and login requests
 */

const Joi = require('joi');
const { VALIDATION } = require('../config/constants');
const { validateRequest } = require('../middleware/authMiddleware');

// Register validation schema
const registerSchema = Joi.object({
  name: Joi.string()
    .min(VALIDATION.NAME_MIN_LENGTH)
    .max(VALIDATION.NAME_MAX_LENGTH)
    .required()
    .messages({
      'string.min': `Name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters`,
      'string.max': `Name cannot exceed ${VALIDATION.NAME_MAX_LENGTH} characters`,
      'any.required': 'Name is required',
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .min(VALIDATION.PASSWORD_MIN_LENGTH)
    .required()
    .messages({
      'string.min': `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`,
      'any.required': 'Password is required',
    }),
}).unknown(false);

// Login validation schema
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
    }),
}).unknown(false);

// Middleware wrappers for routes
const validateRegister = validateRequest(registerSchema);
const validateLogin = validateRequest(loginSchema);

module.exports = {
  registerSchema,
  loginSchema,
  validateRegister,
  validateLogin,
};
