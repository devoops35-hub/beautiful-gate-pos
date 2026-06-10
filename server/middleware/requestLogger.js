/**
 * Request/Response Logging Middleware
 * Logs all incoming requests and outgoing responses
 */

const { logger } = require('../config/logger');

/**
 * Middleware to log requests and responses
 * Includes response time calculation
 */
const requestLoggingMiddleware = (req, res, next) => {
  const start = Date.now();

  // Store original send function
  const originalSend = res.send;

  // Override send function to capture response
  res.send = function (data) {
    const responseTime = Date.now() - start;
    const statusCode = res.statusCode;

    // Log the request/response
    logger.logRequest(req.method, req.path, statusCode, responseTime, req.userId || null);

    // Log detailed info for errors
    if (statusCode >= 400) {
      logger.warn('HTTP Error', {
        method: req.method,
        path: req.path,
        statusCode,
        userId: req.userId || null,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      });
    }

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware to log detailed request information
 * Logs headers, body, and query parameters
 */
const detailedRequestLogger = (req, res, next) => {
  // Skip logging for health checks
  if (req.path === '/health') {
    return next();
  }

  const requestInfo = {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString(),
  };

  // Log query parameters if present
  if (Object.keys(req.query).length > 0) {
    requestInfo.query = req.query;
  }

  // Log body for POST/PUT/PATCH requests (but not passwords)
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const bodyToLog = { ...req.body };
    
    // Remove sensitive fields
    if (bodyToLog.password) bodyToLog.password = '[REDACTED]';
    if (bodyToLog.token) bodyToLog.token = '[REDACTED]';
    if (bodyToLog.refreshToken) bodyToLog.refreshToken = '[REDACTED]';
    if (bodyToLog.cardNumber) bodyToLog.cardNumber = '[REDACTED]';

    if (Object.keys(bodyToLog).length > 0) {
      requestInfo.body = bodyToLog;
    }
  }

  // Add user ID if authenticated
  if (req.userId) {
    requestInfo.userId = req.userId;
  }

  logger.debug('Incoming Request', requestInfo);

  next();
};

/**
 * Middleware to log errors with context
 */
const errorLoggingMiddleware = (err, req, res, next) => {
  logger.logError('Request Error', err, {
    method: req.method,
    path: req.path,
    userId: req.userId || null,
    ip: req.ip,
    headers: req.headers,
  });

  next(err);
};

module.exports = {
  requestLoggingMiddleware,
  detailedRequestLogger,
  errorLoggingMiddleware,
};
