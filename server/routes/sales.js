const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { createSale, verifyTransaction, getSales } = require('../controllers/salesController');

// GET all sales - private
router.get('/', authenticate, getSales);

// POST create sale - private
router.post('/', authenticate, createSale);

// POST verify transaction - private
router.post('/verify/:reference', authenticate, verifyTransaction);

module.exports = router;