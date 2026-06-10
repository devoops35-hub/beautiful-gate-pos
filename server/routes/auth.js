const express = require('express');
const router = express.Router();
const { validateRegister, validateLogin } = require('../validations/authValidation');
const { register, login, refresh, logout, logoutAll } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { authLimiter, refreshLimiter } = require('../middleware/rateLimiter');

// POST register - public (rate limited)
router.post('/register', authLimiter, validateRegister, register);

// POST login - public (rate limited)
router.post('/login', authLimiter, validateLogin, login);

// POST refresh - public (rate limited)
router.post('/refresh', refreshLimiter, refresh);

// POST logout - private
router.post('/logout', authenticate, logout);

// POST logout-all - private (logout from all devices)
router.post('/logout-all', authenticate, logoutAll);

module.exports = router;
