/**
 * Audit Controller
 * Handles audit log retrieval and analysis
 */

const { dbAll, dbGet, dbRun } = require('../config/supabase');
const { logger } = require('../config/logger');

/**
 * @desc    Get audit logs (admin only)
 * @route   GET /api/audit/logs
 * @access  Private (admin)
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, user_id, action, resource_type, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;

    // Build query with PostgreSQL syntax
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (user_id) {
      query += ` AND user_id = $${paramCount}`;
      params.push(user_id);
      paramCount++;
    }

    if (action) {
      query += ` AND action = $${paramCount}`;
      params.push(action.toUpperCase());
      paramCount++;
    }

    if (resource_type) {
      query += ` AND resource_type = $${paramCount}`;
      params.push(resource_type);
      paramCount++;
    }

    if (start_date) {
      query += ` AND created_at >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND created_at <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    // Get total count
    const countResult = await dbGet(
      `SELECT COUNT(*) as total FROM audit_logs WHERE 1=1${
        user_id ? ' AND user_id = $1' : ''
      }${action ? ` AND action = $${user_id ? 2 : 1}` : ''}${
        resource_type ? ` AND resource_type = $${user_id || action ? (user_id && action ? 3 : 2) : 1}` : ''
      }${start_date ? ` AND created_at >= $${user_id || action || resource_type ? (user_id && action && resource_type ? 4 : 3) : 1}` : ''}${
        end_date ? ` AND created_at <= $${user_id || action || resource_type || start_date ? (user_id && action && resource_type && start_date ? 5 : 4) : 1}` : ''
      }`,
      params.slice(0, paramCount - 1)
    );
    const total = countResult.total;

    // Get paginated results
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    const logs = await dbAll(query, params);

    // Parse JSON fields
    const parsedLogs = logs.map(log => ({
      ...log,
      details: log.details ? log.details : null,
    }));

    logger.info('Audit logs retrieved', {
      userId: req.userId,
      count: parsedLogs.length,
      total,
      page,
      limit,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: 'Audit logs retrieved successfully',
      data: parsedLogs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.logError('Error retrieving audit logs', error, { userId: req.userId });
    res.status(500).json({
      success: false,
      message: 'Error retrieving audit logs',
    });
  }
};

/**
 * @desc    Get audit logs for specific user (admin only)
 * @route   GET /api/audit/user/:userId
 * @access  Private (admin)
 */
exports.getUserAuditLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50, action, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;

    // Check if user exists
    const user = await dbGet('SELECT id, name, email FROM users WHERE id = $1', [userId]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Build query
    let query = 'SELECT * FROM audit_logs WHERE user_id = $1';
    const params = [userId];
    let paramCount = 2;

    if (action) {
      query += ` AND action = $${paramCount}`;
      params.push(action.toUpperCase());
      paramCount++;
    }

    if (start_date) {
      query += ` AND created_at >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND created_at <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    // Get total count
    const countResult = await dbGet(
      `SELECT COUNT(*) as total FROM audit_logs WHERE user_id = $1${
        action ? ' AND action = $2' : ''
      }${start_date ? ` AND created_at >= $${action ? 3 : 2}` : ''}${
        end_date ? ` AND created_at <= $${action && start_date ? 4 : action || start_date ? 3 : 2}` : ''
      }`,
      params.slice(0, paramCount - 1)
    );
    const total = countResult.total;

    // Get paginated results
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    const logs = await dbAll(query, params);

    // Parse JSON fields
    const parsedLogs = logs.map(log => ({
      ...log,
      details: log.details ? log.details : null,
    }));

    logger.info('User audit logs retrieved', {
      requestUserId: req.userId,
      targetUserId: userId,
      count: parsedLogs.length,
      total,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: 'User audit logs retrieved successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      data: parsedLogs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.logError('Error retrieving user audit logs', error, { userId: req.userId });
    res.status(500).json({
      success: false,
      message: 'Error retrieving audit logs',
    });
  }
};

/**
 * @desc    Get audit log statistics (admin only)
 * @route   GET /api/audit/stats
 * @access  Private (admin)
 */
exports.getAuditStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get actions summary
    const actionStats = await dbAll(
      `SELECT action, COUNT(*) as count FROM audit_logs 
       WHERE created_at >= $1 
       GROUP BY action 
       ORDER BY count DESC`,
      [startDate.toISOString()]
    );

    // Get resources summary
    const resourceStats = await dbAll(
      `SELECT resource_type, COUNT(*) as count FROM audit_logs 
       WHERE created_at >= $1 
       GROUP BY resource_type 
       ORDER BY count DESC`,
      [startDate.toISOString()]
    );

    // Get top users
    const topUsers = await dbAll(
      `SELECT user_id, COUNT(*) as count FROM audit_logs 
       WHERE created_at >= $1 AND user_id IS NOT NULL
       GROUP BY user_id 
       ORDER BY count DESC 
       LIMIT 10`,
      [startDate.toISOString()]
    );

    // Enrich top users with user info
    const enrichedTopUsers = await Promise.all(
      topUsers.map(async (stat) => {
        const user = await dbGet('SELECT id, name, email FROM users WHERE id = $1', [
          stat.user_id,
        ]);
        return {
          user: {
            id: user?.id,
            name: user?.name,
            email: user?.email,
          },
          count: stat.count,
        };
      })
    );

    // Get daily stats
    const dailyStats = await dbAll(
      `SELECT DATE(created_at) as date, COUNT(*) as count FROM audit_logs 
       WHERE created_at >= $1 
       GROUP BY DATE(created_at) 
       ORDER BY date DESC`,
      [startDate.toISOString()]
    );

    // Get total count
    const totalResult = await dbGet(
      'SELECT COUNT(*) as total FROM audit_logs WHERE created_at >= $1',
      [startDate.toISOString()]
    );

    res.status(200).json({
      success: true,
      message: 'Audit statistics retrieved successfully',
      data: {
        totalEvents: totalResult.total,
        period: `Last ${days} days`,
        actions: actionStats,
        resources: resourceStats,
        topUsers: enrichedTopUsers,
        daily: dailyStats,
      },
    });
  } catch (error) {
    logger.logError('Error retrieving audit stats', error, { userId: req.userId });
    res.status(500).json({
      success: false,
      message: 'Error retrieving audit statistics',
    });
  }
};

/**
 * @desc    Export audit logs (admin only)
 * @route   GET /api/audit/export
 * @access  Private (admin)
 */
exports.exportAuditLogs = async (req, res) => {
  try {
    const { format = 'csv', start_date, end_date } = req.query;

    // Build query
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (start_date) {
      query += ` AND created_at >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND created_at <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    const logs = await dbAll(query, params);

    if (format === 'csv') {
      // Convert to CSV
      const headers = [
        'ID',
        'User ID',
        'Action',
        'Resource Type',
        'Resource ID',
        'Created At',
        'IP Address',
      ];
      const rows = logs.map(log => [
        log.id,
        log.user_id || '',
        log.action,
        log.resource_type,
        log.resource_id || '',
        log.created_at,
        log.ip_address || '',
      ]);

      const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join(
        '\n'
      );

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.csv"`
      );

      logger.info('Audit logs exported', {
        userId: req.userId,
        format: 'csv',
        count: logs.length,
        timestamp: new Date().toISOString(),
      });

      res.send(csv);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.json"`
      );

      logger.info('Audit logs exported', {
        userId: req.userId,
        format: 'json',
        count: logs.length,
        timestamp: new Date().toISOString(),
      });

      res.json(logs);
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported export format. Use "csv" or "json".',
      });
    }
  } catch (error) {
    logger.logError('Error exporting audit logs', error, { userId: req.userId });
    res.status(500).json({
      success: false,
      message: 'Error exporting audit logs',
    });
  }
};
