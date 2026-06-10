/**
 * Rate Limiting Middleware
 * Implements various rate limiting strategies for different endpoints
 */

const rateLimit = require('express-rate-limit');
const { logger } = require('../config/logger');

/**
 * Rate limiter for authentication endpoints (stricter)
 * 5 attempts per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req, res) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded for auth endpoint', {
      ip: req.ip,
      path: req.path,
      timestamp: new Date().toISOString(),
    });
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
    });
  },
});

/**
 * Rate limiter for general API endpoints
 * 100 requests per 15 minutes
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded for general API', {
      ip: req.ip,
      path: req.path,
      timestamp: new Date().toISOString(),
    });
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
    });
  },
});

/**
 * Rate limiter for public endpoints (more lenient)
 * 200 requests per 15 minutes
 */
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  },
});

/**
 * Rate limiter for refresh token endpoint
 * 10 requests per 15 minutes
 */
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per windowMs
  message: 'Too many token refresh attempts',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded for refresh endpoint', {
      ip: req.ip,
      userId: req.userId,
      timestamp: new Date().toISOString(),
    });
    res.status(429).json({
      success: false,
      message: 'Too many token refresh attempts. Please try again later.',
    });
  },
});

/**
 * Rate limiter for file upload endpoints
 * 20 requests per hour
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 requests per windowMs
  message: 'Too many uploads, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  },
});

/**
 * Custom rate limiter with per-user limits
 * Useful for authenticated endpoints
 */
const createUserLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  const limiter = rateLimit({
    windowMs,
    max,
    keyGenerator: (req, res) => {
      // Use userId if authenticated, otherwise use IP
      return req.userId ? `user:${req.userId}` : req.ip;
    },
    skip: (req, res) => {
      return process.env.NODE_ENV === 'development';
    },
    handler: (req, res) => {
      logger.warn('User rate limit exceeded', {
        userId: req.userId,
        ip: req.ip,
        path: req.path,
        timestamp: new Date().toISOString(),
      });
      res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Please try again later.',
      });
    },
  });

  return limiter;
};

module.exports = {
  authLimiter,
  generalLimiter,
  publicLimiter,
  refreshLimiter,
  uploadLimiter,
  createUserLimiter,
};
