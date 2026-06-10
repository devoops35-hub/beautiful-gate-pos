/**
 * Refresh Token Manager
 * Handles refresh token generation, storage, and validation
 */

const jwt = require('jsonwebtoken');
const { dbRun, dbGet, dbAll } = require('../config/supabase');
const { logger } = require('../config/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes

/**
 * Initialize refresh tokens table
 */
const initializeRefreshTokenTable = async () => {
  try {
    // Tables are created during connectDB(), no need to initialize here
    logger.info('Refresh tokens table already initialized');
  } catch (error) {
    logger.logError('Error initializing refresh tokens table', error);
  }
};

/**
 * Generate access token
 * @param {number} userId - User ID
 * @returns {string} Access token
 */
const generateAccessToken = (userId) => {
  const payload = {
    user: {
      id: userId,
    },
    type: 'access',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
};

/**
 * Generate refresh token
 * @param {number} userId - User ID
 * @returns {string} Refresh token
 */
const generateRefreshToken = (userId) => {
  const payload = {
    user: {
      id: userId,
    },
    type: 'refresh',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
};

/**
 * Store refresh token in database
 * @param {number} userId - User ID
 * @param {string} token - Refresh token
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - User agent
 */
const storeRefreshToken = async (userId, token, ipAddress, userAgent) => {
  try {
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000).toISOString();

    const result = await dbRun(
      `INSERT INTO refresh_tokens 
       (user_id, token, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, token, expiresAt, ipAddress, userAgent]
    );

    return result.lastID;
  } catch (error) {
    logger.logError('Error storing refresh token', error, { userId });
    throw error;
  }
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token
 * @returns {object} Decoded token if valid
 */
const verifyRefreshToken = async (token) => {
  try {
    // Verify signature
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if token type is refresh
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Check if token exists and is not revoked in database
    const tokenRecord = await dbGet(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND revoked_at IS NULL',
      [token]
    );

    if (!tokenRecord) {
      throw new Error('Refresh token not found or has been revoked');
    }

    // Check if token has expired
    if (new Date(tokenRecord.expires_at) < new Date()) {
      throw new Error('Refresh token has expired');
    }

    return decoded;
  } catch (error) {
    logger.warn('Invalid refresh token attempt', {
      error: error.message,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Revoke refresh token
 * @param {string} token - Refresh token
 */
const revokeRefreshToken = async (token) => {
  try {
    const revokedAt = new Date().toISOString();
    await dbRun(
      'UPDATE refresh_tokens SET revoked_at = $1 WHERE token = $2',
      [revokedAt, token]
    );
  } catch (error) {
    logger.logError('Error revoking refresh token', error);
    throw error;
  }
};

/**
 * Revoke all refresh tokens for a user (logout all devices)
 * @param {number} userId - User ID
 */
const revokeAllRefreshTokens = async (userId) => {
  try {
    const revokedAt = new Date().toISOString();
    await dbRun(
      'UPDATE refresh_tokens SET revoked_at = $1 WHERE user_id = $2 AND revoked_at IS NULL',
      [revokedAt, userId]
    );
  } catch (error) {
    logger.logError('Error revoking all refresh tokens', error, { userId });
    throw error;
  }
};

/**
 * Get active refresh tokens for a user
 * @param {number} userId - User ID
 * @returns {array} Active refresh tokens
 */
const getActiveRefreshTokens = async (userId) => {
  try {
    const tokens = await dbAll(
      `SELECT id, created_at, ip_address, user_agent, expires_at
       FROM refresh_tokens 
       WHERE user_id = $1 AND revoked_at IS NULL
       ORDER BY created_at DESC`,
      [userId]
    );
    return tokens || [];
  } catch (error) {
    logger.logError('Error getting active refresh tokens', error, { userId });
    throw error;
  }
};

/**
 * Clean up expired refresh tokens
 */
const cleanupExpiredTokens = async () => {
  try {
    // Get all expired tokens first
    const now = new Date().toISOString();
    const expiredTokens = await dbAll(
      'SELECT id FROM refresh_tokens WHERE expires_at < $1',
      [now]
    );

    // Delete them one by one (or in batch if needed)
    for (const token of expiredTokens) {
      await dbRun(
        'DELETE FROM refresh_tokens WHERE id = $1',
        [token.id]
      );
    }

    if (expiredTokens.length > 0) {
      logger.info('Cleaned up expired refresh tokens', {
        count: expiredTokens.length,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.logError('Error cleaning up expired tokens', error);
  }
};

/**
 * Rotate refresh token (revoke old, issue new)
 * @param {string} oldToken - Old refresh token
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - User agent
 * @returns {object} New tokens
 */
const rotateRefreshToken = async (oldToken, ipAddress, userAgent) => {
  try {
    // Verify old token
    const decoded = await verifyRefreshToken(oldToken);
    const userId = decoded.user.id;

    // Revoke old token
    await revokeRefreshToken(oldToken);

    // Generate new tokens
    const newAccessToken = generateAccessToken(userId);
    const newRefreshToken = generateRefreshToken(userId);

    // Store new refresh token
    await storeRefreshToken(userId, newRefreshToken, ipAddress, userAgent);

    logger.info('Refresh token rotated', {
      userId,
      timestamp: new Date().toISOString(),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    logger.logError('Error rotating refresh token', error);
    throw error;
  }
};

module.exports = {
  initializeRefreshTokenTable,
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
  getActiveRefreshTokens,
  cleanupExpiredTokens,
  rotateRefreshToken,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
};
