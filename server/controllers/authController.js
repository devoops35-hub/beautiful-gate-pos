const { dbGet, dbRun, dbAll } = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT, SECURITY, SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../config/constants');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  storeRefreshToken,
  verifyRefreshToken,
  rotateRefreshToken,
  revokeAllRefreshTokens,
} = require('../utils/refreshTokenManager');
const { logAuditEvent } = require('../middleware/auditMiddleware');
const { logger } = require('../config/logger');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.validatedData;

    // Check if user already exists
    const existingUser = await dbGet('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.USER_EXISTS,
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(SECURITY.BCRYPT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await dbRun(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, hashedPassword, 'user']
    );

    const userId = result.lastID;

    // Generate tokens
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    // Store refresh token
    await storeRefreshToken(
      userId,
      refreshToken,
      req.ip,
      req.get('user-agent')
    );

    // Log audit event
    await logAuditEvent(userId, 'REGISTER', 'user', userId, {
      email,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info('User registered', {
      userId,
      email,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: SUCCESS_MESSAGES.REGISTER_SUCCESS,
      accessToken,
      refreshToken,
      user: {
        id: userId,
        name,
        email,
        role: 'user',
      },
    });
  } catch (err) {
    logger.logError('Register error', err);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

/**
 * @desc    Authenticate user and get tokens
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.validatedData;

    // Find user with company info
    const user = await dbGet(
      `SELECT u.*, c.id as company_id, c.name as company_name, c.slug as company_slug, c.logo_url, c.primary_color, c.industry 
       FROM users u 
       LEFT JOIN companies c ON u.company_id = c.id 
       WHERE u.email = $1`,
      [email]
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_CREDENTIALS,
      });
    }

    // Check if user is active
    if (user.is_active === false) {
      logger.warn('Login attempt by inactive user', {
        userId: user.id,
        email,
        timestamp: new Date().toISOString(),
      });

      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn('Failed login attempt', {
        email,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });

      return res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_CREDENTIALS,
      });
    }

    // Update last login time
    dbRun(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    ).catch(err => logger.warn('Failed to update lastLoginAt', { userId: user.id, error: err.message }));

    // Generate tokens with company info
    const tokenData = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.company_id,
      companySlug: user.company_slug
    };
    
    const accessToken = jwt.sign(
      tokenData,
      process.env.JWT_SECRET,
      { expiresIn: JWT.ACCESS_TOKEN_EXPIRY }
    );
    
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    await storeRefreshToken(
      user.id,
      refreshToken,
      req.ip,
      req.get('user-agent')
    );

    // Log audit event
    await logAuditEvent(user.id, 'LOGIN', 'user', user.id, {
      email,
      companyId: user.company_id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info('User logged in', {
      userId: user.id,
      email,
      companyId: user.company_id,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      company: user.company_id ? {
        id: user.company_id,
        name: user.company_name,
        slug: user.company_slug,
        logo_url: user.logo_url,
        primary_color: user.primary_color,
        industry: user.industry
      } : null,
    });
  } catch (err) {
    logger.logError('Login error', err);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Rotate token (verify old, revoke old, issue new)
    const tokens = await rotateRefreshToken(
      refreshToken,
      req.ip,
      req.get('user-agent')
    );

    res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) {
    logger.warn('Token refresh failed', {
      error: err.message,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });

    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Revoke specific refresh token
      const { revokeRefreshToken } = require('../utils/refreshTokenManager');
      await revokeRefreshToken(refreshToken);
    }

    // Log audit event
    await logAuditEvent(req.userId, 'LOGOUT', 'user', req.userId, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info('User logged out', {
      userId: req.userId,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    logger.logError('Logout error', err, { userId: req.userId });
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

/**
 * @desc    Logout all devices (revoke all refresh tokens)
 * @route   POST /api/auth/logout-all
 * @access  Private
 */
exports.logoutAll = async (req, res) => {
  try {
    // Revoke all refresh tokens for this user
    await revokeAllRefreshTokens(req.userId);

    // Log audit event
    await logAuditEvent(req.userId, 'LOGOUT_ALL', 'user', req.userId, {
      reason: 'Logged out from all devices',
      ipAddress: req.ip,
    });

    logger.info('User logged out from all devices', {
      userId: req.userId,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully',
    });
  } catch (err) {
    logger.logError('Logout all error', err, { userId: req.userId });
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};
