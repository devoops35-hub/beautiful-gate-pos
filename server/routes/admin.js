/**
 * Admin Routes
 * Admin-only endpoints for user and system management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/rbacMiddleware');
const {
  getAllUsers,
  getUser,
  updateUserRole,
  deactivateUser,
  activateUser,
  resetUserPassword,
  createAdminUser,
} = require('../controllers/adminController');

// All routes require authentication and admin role

// GET all users
router.get('/users', authenticate, requireAdmin, getAllUsers);

// POST create new user/admin
router.post('/users', authenticate, requireAdmin, createAdminUser);

// GET specific user
router.get('/users/:userId', authenticate, requireAdmin, getUser);

// PUT update user role
router.put('/users/:userId/role', authenticate, requireAdmin, updateUserRole);

// PUT deactivate user
router.put('/users/:userId/deactivate', authenticate, requireAdmin, deactivateUser);

// PUT activate user
router.put('/users/:userId/activate', authenticate, requireAdmin, activateUser);

// PUT reset user password
router.put('/users/:userId/reset-password', authenticate, requireAdmin, resetUserPassword);

module.exports = router;
