const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const { NODE_ENV } = require('./constants');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Define log levels
 */
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

/**
 * Define colors for console output
 */
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

winston.addColors(colors);

/**
 * Console transport for development
 */
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...args }) => {
      if (Object.keys(args).length > 0) {
        return `${timestamp} [${level}]: ${message} ${JSON.stringify(args, null, 2)}`;
      }
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
});

/**
 * File transport for all logs
 */
const fileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxDays: '14d',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
});

/**
 * Error file transport for errors only
 */
const errorFileTransport = new DailyRotateFile({
  level: 'error',
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxDays: '14d',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
});

/**
 * Request/Response file transport
 */
const requestFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'requests-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxDays: '7d',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
});

/**
 * Audit trail file transport
 */
const auditFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'audit-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxDays: '30d',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
});

/**
 * Create main logger
 */
const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  transports: [
    NODE_ENV !== 'test' && consoleTransport,
    fileTransport,
    errorFileTransport,
  ].filter(Boolean),
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxDays: '14d',
    }),
  ],
});

/**
 * Create request logger (separate instance for request/response logging)
 */
const requestLogger = winston.createLogger({
  level: 'info',
  levels,
  transports: [
    NODE_ENV !== 'test' && consoleTransport,
    requestFileTransport,
  ].filter(Boolean),
});

/**
 * Create audit logger (separate instance for audit trails)
 */
const auditLogger = winston.createLogger({
  level: 'info',
  levels,
  transports: [
    auditFileTransport,
  ].filter(Boolean),
});

/**
 * Log error with context
 */
logger.logError = (message, error, context = {}) => {
  logger.error(message, {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    context,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log audit event
 */
logger.logAudit = (action, resource, userId, details = {}) => {
  auditLogger.info('Audit Event', {
    action,
    resource,
    userId,
    details,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log request
 */
logger.logRequest = (method, path, statusCode, responseTime, userId = null) => {
  requestLogger.info('API Request', {
    method,
    path,
    statusCode,
    responseTime: `${responseTime}ms`,
    userId,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  logger,
  requestLogger,
  auditLogger,
};
