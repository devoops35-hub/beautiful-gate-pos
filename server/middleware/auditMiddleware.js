/**
 * Audit Trail Middleware
 * Logs all CRUD operations for audit purposes
 */

const { dbRun } = require('../config/supabase');
const { logger } = require('../config/logger');

/**
 * Initialize audit logs table if not exists
 */
const initializeAuditTable = async () => {
  try {
    // Tables are created during connectDB(), no need to initialize here
    logger.info('Audit logs table already initialized');
  } catch (error) {
    logger.logError('Error initializing audit table', error);
  }
};

/**
 * Log audit event
 * @param {number} userId - User ID performing the action
 * @param {string} action - Action type (create, update, delete, login, logout)
 * @param {string} resource - Resource type (user, product, sale, settings)
 * @param {number} resourceId - ID of the affected resource
 * @param {object} details - Additional details
 */
const logAuditEvent = async (userId, action, resource, resourceId, details = {}) => {
  try {
    const { oldValue, newValue, reason, ipAddress, userAgent } = details;

    await dbRun(
      `INSERT INTO audit_logs 
       (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId || null,
        action,
        resource,
        resourceId || null,
        JSON.stringify({
          oldValue,
          newValue,
          reason,
          ...details,
        }),
        ipAddress || null,
        userAgent || null,
      ]
    );

    // Also log to file
    logger.logAudit(action, resource, userId, {
      resourceId,
      oldValue,
      newValue,
      ...details,
    });
  } catch (error) {
    logger.logError('Error logging audit event', error, {
      userId,
      action,
      resource,
      resourceId,
    });
  }
};

/**
 * Middleware to automatically log CREATE operations
 * Should be applied after successful creation
 */
const auditCreate = (resource) => {
  return (req, res, next) => {
    // Override res.json to capture response
    const originalJson = res.json;
    
    res.json = function (data) {
      if (data.success && data.data) {
        const resourceId = data.data._id || data.data.id;
        
        logAuditEvent(
          req.userId || null,
          'CREATE',
          resource,
          resourceId,
          {
            newValue: data.data,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          }
        ).catch(err => logger.logError('Error in auditCreate', err));
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Middleware to automatically log UPDATE operations
 * Requires oldValue to be stored in req.auditOldValue
 */
const auditUpdate = (resource) => {
  return (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function (data) {
      if (data.success && data.data) {
        const resourceId = data.data._id || data.data.id;
        
        logAuditEvent(
          req.userId || null,
          'UPDATE',
          resource,
          resourceId,
          {
            oldValue: req.auditOldValue,
            newValue: data.data,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          }
        ).catch(err => logger.logError('Error in auditUpdate', err));
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Middleware to automatically log DELETE operations
 * Requires deletedData to be stored in req.auditDeletedData
 */
const auditDelete = (resource) => {
  return (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function (data) {
      if (data.success) {
        const resourceId = req.params.id || req.body.id;
        
        logAuditEvent(
          req.userId || null,
          'DELETE',
          resource,
          resourceId,
          {
            oldValue: req.auditDeletedData,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          }
        ).catch(err => logger.logError('Error in auditDelete', err));
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Middleware to log authentication events
 */
const auditAuth = (action, resource = 'user') => {
  return (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function (data) {
      if (data.success) {
        const userId = data.user?.id || data.user?._id;
        
        logAuditEvent(
          userId || null,
          action.toUpperCase(),
          resource,
          userId,
          {
            email: data.user?.email,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          }
        ).catch(err => logger.logError('Error in auditAuth', err));
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Middleware to capture old data before modification
 * Used for audit updates
 */
const captureOldData = async (req, res, next) => {
  // This middleware should be implemented in individual routes
  // as the data retrieval depends on the specific resource
  next();
};

module.exports = {
  initializeAuditTable,
  logAuditEvent,
  auditCreate,
  auditUpdate,
  auditDelete,
  auditAuth,
  captureOldData,
};
