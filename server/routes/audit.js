/**
 * Audit Routes
 * Admin-only endpoints for audit log management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/rbacMiddleware');
const {
  getAuditLogs,
  getUserAuditLogs,
  getAuditStats,
  exportAuditLogs,
} = require('../controllers/auditController');

// All routes require authentication and admin role

// GET audit logs with filtering
router.get('/logs', authenticate, requireAdmin, getAuditLogs);

// GET user-specific audit logs
router.get('/user/:userId', authenticate, requireAdmin, getUserAuditLogs);

// GET audit statistics
router.get('/stats', authenticate, requireAdmin, getAuditStats);

// GET export audit logs (CSV or JSON)
router.get('/export', authenticate, requireAdmin, exportAuditLogs);

module.exports = router;
