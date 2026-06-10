/**
 * Product Validation Schemas
 * Validates product creation and update requests
 */

const Joi = require('joi');
const { VALIDATION } = require('../config/constants');
const { validateRequest } = require('../middleware/authMiddleware');

// Add product validation schema
const addProductSchema = Joi.object({
  name: Joi.string()
    .max(VALIDATION.PRODUCT_NAME_MAX_LENGTH)
    .required()
    .messages({
      'string.max': `Product name cannot exceed ${VALIDATION.PRODUCT_NAME_MAX_LENGTH} characters`,
      'any.required': 'Product name is required',
    }),
  price: Joi.number()
    .min(VALIDATION.PRICE_MIN)
    .max(VALIDATION.PRICE_MAX)
    .required()
    .messages({
      'number.min': `Price must be at least ${VALIDATION.PRICE_MIN}`,
      'number.max': `Price cannot exceed ${VALIDATION.PRICE_MAX}`,
      'number.base': 'Price must be a number',
      'any.required': 'Price is required',
    }),
  quantity: Joi.number()
    .integer()
    .min(VALIDATION.QUANTITY_MIN)
    .max(VALIDATION.QUANTITY_MAX)
    .required()
    .messages({
      'number.integer': 'Quantity must be a whole number',
      'number.min': `Quantity must be at least ${VALIDATION.QUANTITY_MIN}`,
      'number.max': `Quantity cannot exceed ${VALIDATION.QUANTITY_MAX}`,
      'number.base': 'Quantity must be a number',
      'any.required': 'Quantity is required',
    }),
  description: Joi.string()
    .max(VALIDATION.PRODUCT_DESCRIPTION_MAX_LENGTH)
    .allow('')
    .messages({
      'string.max': `Description cannot exceed ${VALIDATION.PRODUCT_DESCRIPTION_MAX_LENGTH} characters`,
    }),
}).unknown(false);

// Update product validation schema
const updateProductSchema = Joi.object({
  name: Joi.string()
    .max(VALIDATION.PRODUCT_NAME_MAX_LENGTH)
    .messages({
      'string.max': `Product name cannot exceed ${VALIDATION.PRODUCT_NAME_MAX_LENGTH} characters`,
    }),
  price: Joi.number()
    .min(VALIDATION.PRICE_MIN)
    .max(VALIDATION.PRICE_MAX)
    .messages({
      'number.min': `Price must be at least ${VALIDATION.PRICE_MIN}`,
      'number.max': `Price cannot exceed ${VALIDATION.PRICE_MAX}`,
      'number.base': 'Price must be a number',
    }),
  quantity: Joi.number()
    .integer()
    .min(VALIDATION.QUANTITY_MIN)
    .max(VALIDATION.QUANTITY_MAX)
    .messages({
      'number.integer': 'Quantity must be a whole number',
      'number.min': `Quantity must be at least ${VALIDATION.QUANTITY_MIN}`,
      'number.max': `Quantity cannot exceed ${VALIDATION.QUANTITY_MAX}`,
      'number.base': 'Quantity must be a number',
    }),
  description: Joi.string()
    .max(VALIDATION.PRODUCT_DESCRIPTION_MAX_LENGTH)
    .allow('')
    .messages({
      'string.max': `Description cannot exceed ${VALIDATION.PRODUCT_DESCRIPTION_MAX_LENGTH} characters`,
    }),
}).unknown(false).min(1);

// Product ID validation schema
const productIdSchema = Joi.object({
  id: Joi.number().required(),
}).unknown(false);

// Middleware wrappers
const validateAddProduct = validateRequest(addProductSchema);
const validateUpdateProduct = validateRequest(updateProductSchema);
const validateProductId = (req, res, next) => {
  const { error } = productIdSchema.validate({ id: parseInt(req.params.id) });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID',
    });
  }
  next();
};

module.exports = {
  addProductSchema,
  updateProductSchema,
  productIdSchema,
  validateAddProduct,
  validateUpdateProduct,
  validateProductId,
};
