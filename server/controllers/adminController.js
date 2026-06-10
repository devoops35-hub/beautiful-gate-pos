/**
 * Admin Controller
 * Handles admin operations like user management
 */

const { dbAll, dbGet, dbRun } = require('../config/supabase');
const { logger } = require('../config/logger');
const { logAuditEvent } = require('../middleware/auditMiddleware');
const bcrypt = require('bcryptjs');
const { SECURITY } = require('../config/constants');

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/admin/users
 * @access  Private (admin)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 50, role, is_active } = req.query;
    const offset = (page - 1) * limit;

    // Build query with PostgreSQL syntax
    let query = 'SELECT id, name, email, role, is_active, created_at, last_login_at FROM users WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (role) {
      query += ` AND role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }

    if (is_active !== undefined) {
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active === 'true');
      paramCount++;
    }

    // Get total count
    const countResult = await dbGet(
      `SELECT COUNT(*) as total FROM users WHERE 1=1${
        role ? ` AND role = $1` : ''
      }${is_active !== undefined ? ` AND is_active = $${role ? 2 : 1}` : ''}`,
      params.slice(0, paramCount - 1)
    );
    const total = countResult.total;

    // Get paginated results
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    const users = await dbAll(query, params);

    logger.info('All users retrieved', {
      userId: req.userId,
      count: users.length,
      total,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.logError('Error retrieving users', error, { userId: req.userId });
    res.status(500).json({
      success: false,
      message: 'Error retrieving users',
    });
  }
};

/**
 * @desc    Get user by ID (admin only)
 * @route   GET /api/admin/users/:userId
 * @access  Private (admin)
 */
exports.getUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await dbGet(
      'SELECT id, name, email, role, is_active, created_at, last_login_at FROM users WHERE id = $1',
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user,
    });
  } catch (error) {
    logger.logError('Error retrieving user', error, { userId: req.userId });
    res.status(500).json({
      success: false,
      message: 'Error retrieving user',
    });
  }
};

/**
 * @desc    Update user role (admin only)
 * @route   PUT /api/admin/users/:userId/role
 * @access  Private (admin)
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    const allowedRoles = ['user', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}`,
      });
    }

    // Prevent removing admin from self
    if (userId == req.userId && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove admin role from yourself',
      });
    }

    // Get old user data
    const oldUser = await dbGet('SELECT role FROM users WHERE id = $1', [userId]);
    if (!oldUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update user role
    await dbRun('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);

    // Log audit event
    await logAuditEvent(req.userId, 'UPDATE_ROLE', 'user', userId, {
      oldValue: { role: oldUser.role },
      newValue: { role },
      ipAddress: req.ip,
    });

    logger.info('User role updated', {
      adminId: req.userId,
      userId,
      newRole: role,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
    });
  } catch (error) {
    logger.logError('Error updating user role', error, { userId: req.userId });
    res.status(500).json({
      success: false,
      message: 'Error updating user role',
    });
  }
};

/**
 * @desc    Deactivate user (admin only)
 * @route   PUT /api/admin/users/:userId/deactivate
 * @access  Private (admin)
 */
exports.deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent deactivating self
    if (userId == req.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account',
      });
    }

    // Get old user data
    const oldUser = await dbGet('SELECT is_active FROM users WHERE id = $1', [userId]);
    if (!oldUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Deactivate user
    await dbRun('UPDATE users SET is_active = false WHERE id = $1', [userId]);

    // Revoke all refresh tokens
    const { revokeAllRefreshTokens } = require('../utils/refreshTokenManager');
    await revokeAllRefreshTokens(userId);

    // Log audit event
    await logAuditEvent(req.userId, 'DEACTIVATE', 'user', userId, {
      reason: 'User deactivated by admin',
      ipAddress: req.ip,
    });

    logger.warn('User deactivated', {
      adminId: req.userId,
      userId,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    logger.logError('Error deactivating user', error, { userId: req.userId });
    res.status(500).json({
      success: false,
      message: 'Error deactivating user',
    });
  }
};

/**
 * @desc    Reactivate user (admin only)
 * @route   PUT /api/admin/users/:userId/activate
 * @access  Private (admin)
 */
exports.activateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await dbGet('SELECT is_active FROM users WHERE id = $1', [userId]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Activate user
    await dbRun('UPDATE users SET is_active = true WHERE id = $1', [userId]);

    // Log audit event
    await logAuditEvent(req.userId, 'ACTIVATE', 'user', userId, {
      reason: 'User reactivated by admin',
      ipAddress: req.ip,
    });

    logger.info('User activated', {
      adminId: req.userId,
      userId,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: 'User activated successfully',
    });
  } catch (error) {
    logger.logError('Error activating user', error, { userId: req.userId });
    res.status(500).json({
      success: false,
      message: 'Error activating user',
    });
  }
};

/**
 * @desc    Reset user password (admin only)
 * @route   PUT /api/admin/users/:userId/reset-password
 * @access  Private (admin)
 */
exports.resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Check if user exists
    const user = await dbGet('SELECT id FROM users WHERE id = $1', [userId]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(SECURITY.BCRYPT_ROUNDS);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await dbRun('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

    // Revoke all refresh tokens
    const { revokeAllRefreshTokens } = require('../utils/refreshTokenManager');
    await revokeAllRefreshTokens(userId);

    // Log audit event
    await logAuditEvent(req.userId, 'RESET_PASSWORD', 'user', userId, {
      reason: 'Password reset by admin',
      ipAddress: req.ip,
    });

    logger.warn('User password reset by admin', {
      adminId: req.userId,
      userId,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: 'User password reset successfully',
    });
  } catch (error) {
    logger.logError('Error resetting user password', error, { userId: req.userId });
    res.status(500).json({
      success: false,
      message: 'Error resetting user password',
    });
  }
};

/**
 * @desc    Create admin user (admin only)
 * @route   POST /api/admin/users
 * @access  Private (admin)
 */
exports.createAdminUser = async (req, res) => {
  try {
    const { name, email, password, role = 'admin' } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Check if user already exists
    const existingUser = await dbGet('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(SECURITY.BCRYPT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await dbRun(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, hashedPassword, role]
    );

    const newUserId = result.rows[0].id;

    // Log audit event
    await logAuditEvent(req.userId, 'CREATE_USER', 'user', newUserId, {
      email,
      role,
      ipAddress: req.ip,
    });

    logger.info('New admin user created', {
      adminId: req.userId,
      newUserId,
      email,
      role,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        id: newUserId,
        name,
        email,
        role,
      },
    });
  } catch (error) {
    logger.logError('Error creating admin user', error, { userId: req.userId });
    res.status(500).json({
      success: false,
      message: 'Error creating user',
    });
  }
};
