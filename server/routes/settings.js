const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { validateUpdateSettings } = require('../validations/settingsValidation');
const { getSettings, getSetting, updateSetting, getTaxRate } = require('../controllers/settingsController');

// GET all settings - private
router.get('/', authenticate, getSettings);

// GET tax rate - public
router.get('/tax-rate', getTaxRate);

// GET specific setting - private
router.get('/:key', authenticate, getSetting);

// PUT update setting - private
router.put('/:key', authenticate, validateUpdateSettings, updateSetting);

module.exports = router;
