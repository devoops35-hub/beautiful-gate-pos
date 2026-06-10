/**
 * Application Constants and Environment Configuration
 * Centralized configuration management for the POS server
 */

require('dotenv').config();

// Environment validation
const requiredEnvVars = [
  'JWT_SECRET',
  'PAYSTACK_SECRET_KEY',
  'PAYSTACK_PUBLIC_KEY',
];

const validateEnvironment = () => {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      `Please check your .env file.`
    );
  }

  // Validate JWT_SECRET length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 16) {
    throw new Error(
      'JWT_SECRET must be at least 16 characters long. ' +
      'Generate a strong one with: openssl rand -base64 32'
    );
  }
};

module.exports = {
  // Application
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3003,
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || './pos.db',
  
  // JWT Configuration
  JWT: {
    SECRET: process.env.JWT_SECRET,
    EXPIRY: '24h',
    REFRESH_EXPIRY: '7d',
  },
  
  // Paystack Configuration
  PAYSTACK: {
    SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
    PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY,
    BASE_URL: 'https://api.paystack.co',
    TIMEOUT: 30000, // 30 seconds
  },
  
  // CORS Configuration
  CORS: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  },
  
  // Rate Limiting
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  
  // Security
  SECURITY: {
    BCRYPT_ROUNDS: 10,
    PASSWORD_MIN_LENGTH: 6,
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // Validation
  VALIDATION: {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PASSWORD_MIN_LENGTH: 6,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    PRODUCT_NAME_MAX_LENGTH: 255,
    PRODUCT_DESCRIPTION_MAX_LENGTH: 1000,
    QUANTITY_MIN: 0,
    QUANTITY_MAX: 999999,
    PRICE_MIN: 0,
    PRICE_MAX: 999999.99,
  },
  
  // Error Messages
  ERROR_MESSAGES: {
    VALIDATION_FAILED: 'Validation failed. Please check your input.',
    UNAUTHORIZED: 'Unauthorized. Please log in.',
    FORBIDDEN: 'Forbidden. You do not have permission to access this resource.',
    NOT_FOUND: 'Resource not found.',
    SERVER_ERROR: 'An internal server error occurred.',
    INVALID_CREDENTIALS: 'Invalid email or password.',
    USER_EXISTS: 'User with this email already exists.',
    INVALID_TOKEN: 'Invalid or expired token.',
    MISSING_REQUIRED_FIELDS: 'Missing required fields.',
  },
  
  // Success Messages
  SUCCESS_MESSAGES: {
    LOGIN_SUCCESS: 'Login successful.',
    REGISTER_SUCCESS: 'Registration successful.',
    LOGOUT_SUCCESS: 'Logout successful.',
    PRODUCT_CREATED: 'Product created successfully.',
    PRODUCT_UPDATED: 'Product updated successfully.',
    PRODUCT_DELETED: 'Product deleted successfully.',
    SALE_CREATED: 'Sale recorded successfully.',
  },
  
  // Validate environment on module load
  validateEnvironment,
};
