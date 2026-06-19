/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes
 */

const jwt = require('jsonwebtoken');
const { JWT, ERROR_MESSAGES } = require('../config/constants');

/**
 * Middleware to verify JWT token from Authorization header or x-auth-token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = (req, res, next) => {
  try {
    // Get token from Authorization header (Bearer token) or x-auth-token header
    let token = req.headers.authorization;
    
    if (token && token.startsWith('Bearer ')) {
      token = token.slice(7); // Remove 'Bearer ' prefix
    } else {
      token = req.headers['x-auth-token'];
    }

    if (!token) {
      console.warn('Authentication failed - no token found in headers:', {
        authHeader: !!req.headers.authorization,
        tokenHeader: !!req.headers['x-auth-token'],
        path: req.path,
      });
      return res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        error: 'No token provided',
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || JWT.SECRET);
    
    // Handle both old format (with nested user object) and new format (flat with company info)
    if (decoded.user) {
      // Old format compatibility
      req.userId = decoded.user.id;
      req.user = decoded.user;
    } else {
      // New format with company info
      req.userId = decoded.userId;
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        companyId: decoded.companyId,
        companySlug: decoded.companySlug
      };
    }
    
    next();
  } catch (error) {
    console.warn('Authentication error:', {
      error: error.message,
      path: req.path,
      tokenPresent: !!req.headers.authorization || !!req.headers['x-auth-token'],
    });
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN,
        error: 'Token has expired',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN,
        error: 'Invalid token',
      });
    }

    return res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      error: error.message,
    });
  }
};

/**
 * Middleware to check if user is authenticated (optional auth)
 * Sets req.user if token is valid, otherwise continues
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = (req, res, next) => {
  try {
    let token = req.headers.authorization;
    
    if (token && token.startsWith('Bearer ')) {
      token = token.slice(7);
    } else {
      token = req.headers['x-auth-token'];
    }

    if (token) {
      const decoded = jwt.verify(token, JWT.SECRET);
      req.userId = decoded.user.id;
      req.user = decoded.user;
    }
  } catch (error) {
    // Silently fail for optional auth
    console.debug('Optional auth failed:', error.message);
  }
  
  next();
};

/**
 * Validation middleware wrapper
 * Validates request data using Joi schema
 * @param {Object} schema - Joi validation schema
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please check your input.',
        details,
      });
    }

    // Store validated data in request
    req.validatedData = value;
    next();
  };
};

/**
 * Error handler middleware
 * Catches and formats errors uniformly
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: ERROR_MESSAGES.INVALID_TOKEN,
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: ERROR_MESSAGES.INVALID_TOKEN,
      error: 'Token has expired',
    });
  }

  // Validation errors
  if (error.isJoi) {
    return res.status(400).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_FAILED,
      details: error.details,
    });
  }

  // Generic error
  res.status(error.status || 500).json({
    success: false,
    message: error.message || ERROR_MESSAGES.SERVER_ERROR,
  });
};

/**
 * Request logger middleware
 * Logs incoming requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  
  if (req.userId) {
    console.log(`  User ID: ${req.userId}`);
  }
  
  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  validateRequest,
  errorHandler,
  requestLogger,
};
