const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const {
  registerCompany,
  getCompanyBranding,
  updateCompanyBranding,
  getCompanyDetails,
  updateCompanyDetails
} = require('../controllers/companyController');

// Public route - register new company
router.post('/register', registerCompany);

// Protected routes - require authentication
router.get('/branding', authenticate, getCompanyBranding);
router.put('/branding', authenticate, updateCompanyBranding);

router.get('/', authenticate, getCompanyDetails);
router.put('/', authenticate, updateCompanyDetails);

module.exports = router;
