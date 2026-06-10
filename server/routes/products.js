const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const {
  validateAddProduct,
  validateUpdateProduct,
  validateProductId,
} = require('../validations/productValidation');
const {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

// GET all products - public
router.get('/', getProducts);

// POST new product - private
router.post('/', authenticate, validateAddProduct, addProduct);

// PUT update product - private
router.put('/:id', authenticate, validateProductId, validateUpdateProduct, updateProduct);

// DELETE product - private
router.delete('/:id', authenticate, validateProductId, deleteProduct);

module.exports = router;
