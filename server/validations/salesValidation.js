/**
 * Sales Validation Schemas
 * Validates sales creation and payment verification requests
 */

const Joi = require('joi');
const { validateRequest } = require('../middleware/authMiddleware');

// Create sale validation schema
const createSaleSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.number().required(),
        quantity: Joi.number().integer().min(1).required(),
        price: Joi.number().min(0).required(),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'Sale must contain at least one item',
      'any.required': 'Items are required',
    }),
  total: Joi.number()
    .min(0)
    .required()
    .messages({
      'any.required': 'Total amount is required',
      'number.base': 'Total must be a number',
    }),
  paymentMethod: Joi.string()
    .valid('cash', 'card', 'transfer')
    .required()
    .messages({
      'any.only': 'Payment method must be cash, card, or transfer',
      'any.required': 'Payment method is required',
    }),
  amountPaid: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.min': 'Amount paid must be at least 0',
      'number.base': 'Amount paid must be a number',
      'any.required': 'Amount paid is required',
    }),
  customerEmail: Joi.string()
    .email()
    .allow(null, '')
    .optional()
    .messages({
      'string.email': 'Please provide a valid email address',
    }),
  customerPhone: Joi.string()
    .allow(null, '')
    .optional(),
}).unknown(false);

// Verify transaction schema
const verifyTransactionSchema = Joi.object({
  products: Joi.array()
    .items(
      Joi.object({
        product: Joi.number().required(),
        quantity: Joi.number().integer().min(1).required(),
        price: Joi.number().min(0).required(),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'Sale must contain at least one item',
      'any.required': 'Products are required',
    }),
  total: Joi.number()
    .min(0)
    .required()
    .messages({
      'any.required': 'Total amount is required',
      'number.base': 'Total must be a number',
    }),
  paymentMethod: Joi.string()
    .required()
    .messages({
      'any.required': 'Payment method is required',
    }),
  customerEmail: Joi.string()
    .email()
    .allow(null, '')
    .optional()
    .messages({
      'string.email': 'Please provide a valid email address',
    }),
  customerPhone: Joi.string()
    .allow(null, '')
    .optional(),
}).unknown(false);

// Middleware wrappers
const validateCreateSale = validateRequest(createSaleSchema);
const validatePaystackTransaction = validateRequest(verifyTransactionSchema);

module.exports = {
  createSaleSchema,
  verifyTransactionSchema,
  validateCreateSale,
  validatePaystackTransaction,
};
