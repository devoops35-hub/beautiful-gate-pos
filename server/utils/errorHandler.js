/**
 * Error Handler Utility
 * Centralized error handling and response formatting
 */

const { ERROR_MESSAGES, SUCCESS_MESSAGES, NODE_ENV } = require('../config/constants');

/**
 * Custom API Error Class
 */
class APIError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'APIError';
  }
}

/**
 * Format success response
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
const formatSuccessResponse = (data, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    statusCode,
  };
};

/**
 * Format error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Array} details - Error details
 */
const formatErrorResponse = (message = ERROR_MESSAGES.SERVER_ERROR, statusCode = 500, details = null) => {
  return {
    success: false,
    message,
    ...(details && { details }),
    statusCode,
  };
};

/**
 * Async handler wrapper to catch errors
 * @param {Function} fn - Async route handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Validation error helper
 * @param {string} message - Error message
 * @param {Array} details - Validation details
 */
const validationError = (message = ERROR_MESSAGES.VALIDATION_FAILED, details = null) => {
  return new APIError(message, 400, details);
};

/**
 * Authentication error helper
 * @param {string} message - Error message
 */
const authenticationError = (message = ERROR_MESSAGES.UNAUTHORIZED) => {
  return new APIError(message, 401);
};

/**
 * Authorization error helper
 * @param {string} message - Error message
 */
const authorizationError = (message = ERROR_MESSAGES.FORBIDDEN) => {
  return new APIError(message, 403);
};

/**
 * Not found error helper
 * @param {string} message - Error message
 */
const notFoundError = (message = ERROR_MESSAGES.NOT_FOUND) => {
  return new APIError(message, 404);
};

/**
 * Server error helper
 * @param {string} message - Error message
 */
const serverError = (message = ERROR_MESSAGES.SERVER_ERROR) => {
  return new APIError(message, 500);
};

/**
 * Global error handler middleware
 * @param {Error} error - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next
 */
const globalErrorHandler = (error, req, res, next) => {
  console.error('[ERROR]', {
    name: error.name,
    message: error.message,
    statusCode: error.statusCode || 500,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // APIError instances
  if (error instanceof APIError) {
    return res.status(error.statusCode).json(
      formatErrorResponse(error.message, error.statusCode, error.details)
    );
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json(
      formatErrorResponse(ERROR_MESSAGES.INVALID_TOKEN, 401)
    );
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json(
      formatErrorResponse('Token has expired', 401)
    );
  }

  // Joi validation errors
  if (error.isJoi) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    return res.status(400).json(
      formatErrorResponse(ERROR_MESSAGES.VALIDATION_FAILED, 400, details)
    );
  }

  // Default server error
  const message = NODE_ENV === 'production' 
    ? ERROR_MESSAGES.SERVER_ERROR 
    : error.message;

  return res.status(error.statusCode || 500).json(
    formatErrorResponse(message, error.statusCode || 500)
  );
};

module.exports = {
  APIError,
  formatSuccessResponse,
  formatErrorResponse,
  asyncHandler,
  validationError,
  authenticationError,
  authorizationError,
  notFoundError,
  serverError,
  globalErrorHandler,
};
