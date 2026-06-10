/**
 * Role-Based Access Control (RBAC) Middleware
 * Protects endpoints based on user roles
 */

const { dbGet } = require('../config/supabase');
const { logger } = require('../config/logger');

/**
 * Middleware to check if user has admin role
 * Must be used after authentication middleware
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Get user from database to check role
    const user = await dbGet('SELECT role FROM users WHERE id = $1', [req.userId]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role !== 'admin') {
      logger.warn('Unauthorized admin access attempt', {
        userId: req.userId,
        role: user.role,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
      });

      return res.status(403).json({
        success: false,
        message: 'Admin privileges required',
      });
    }

    // Store role in request for later use
    req.userRole = user.role;
    next();
  } catch (error) {
    logger.logError('Error checking admin role', error, { userId: req.userId });
    res.status(500).json({
      success: false,
      message: 'Error checking permissions',
    });
  }
};

/**
 * Middleware to check multiple roles
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const requireRole = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Get user from database to check role
      const user = await dbGet('SELECT role FROM users WHERE id = $1', [req.userId]);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      if (!allowedRoles.includes(user.role)) {
        logger.warn('Unauthorized role access attempt', {
          userId: req.userId,
          userRole: user.role,
          requiredRoles: allowedRoles,
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString(),
        });

        return res.status(403).json({
          success: false,
          message: `Required role(s): ${allowedRoles.join(', ')}`,
        });
      }

      // Store role in request for later use
      req.userRole = user.role;
      next();
    } catch (error) {
      logger.logError('Error checking role permissions', error, { userId: req.userId });
      res.status(500).json({
        success: false,
        message: 'Error checking permissions',
      });
    }
  };
};

/**
 * Middleware to attach user role to request without enforcing
 * Useful for operations that may have different behavior based on role
 */
const attachUserRole = async (req, res, next) => {
  try {
    if (!req.userId) {
      req.userRole = null;
      return next();
    }

    const user = await dbGet('SELECT role FROM users WHERE id = $1', [req.userId]);
    req.userRole = user?.role || 'user';
    next();
  } catch (error) {
    logger.logError('Error attaching user role', error, { userId: req.userId });
    req.userRole = null;
    next(); // Continue even if role retrieval fails
  }
};

module.exports = {
  requireAdmin,
  requireRole,
  attachUserRole,
};
