const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { getDashboardStats } = require('../controllers/dashboardController');

// GET dashboard stats - private
router.get('/stats', authenticate, getDashboardStats);

module.exports = router;