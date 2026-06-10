const { dbAll, dbRun, dbGet } = require('../config/supabase');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../config/constants');

/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Public
 */
exports.getProducts = async (req, res, next) => {
  try {
    const products = await dbAll('SELECT * FROM products ORDER BY created_at DESC');
    // Convert id to _id for frontend compatibility
    const formattedProducts = products.map(p => ({
      ...p,
      _id: p.id,
      id: undefined
    }));
    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: formattedProducts,
    });
  } catch (err) {
    console.error('getProducts error:', err.message);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

/**
 * @desc    Add a new product
 * @route   POST /api/products
 * @access  Private
 */
exports.addProduct = async (req, res, next) => {
  try {
    const { name, price, quantity } = req.validatedData;

    const result = await dbRun(
      'INSERT INTO products (name, price, quantity) VALUES ($1, $2, $3) RETURNING id',
      [name, parseFloat(price), parseInt(quantity)]
    );

    const product = await dbGet('SELECT * FROM products WHERE id = $1', [result.lastID]);

    res.status(201).json({
      success: true,
      message: SUCCESS_MESSAGES.PRODUCT_CREATED,
      data: {
        ...product,
        _id: product.id,
        id: undefined
      },
    });
  } catch (err) {
    console.error('addProduct error:', err.message);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Private
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, quantity } = req.validatedData;

    // Check if product exists
    const existing = await dbGet('SELECT * FROM products WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.NOT_FOUND,
      });
    }

    // Build update data only with provided fields
    const updateData = {};
    if (name !== undefined && name !== null) {
      updateData.name = name;
    }
    if (price !== undefined && price !== null) {
      updateData.price = parseFloat(price);
    }
    if (quantity !== undefined && quantity !== null) {
      updateData.quantity = parseInt(quantity);
    }

    // Only update if there are changes
    if (Object.keys(updateData).length > 0) {
      await dbRun(
        `UPDATE products SET ${Object.keys(updateData).map((key, idx) => `${key} = $${idx + 1}`).join(', ')} WHERE id = $${Object.keys(updateData).length + 1}`,
        [...Object.values(updateData), id]
      );
    }

    const updatedProduct = await dbGet('SELECT * FROM products WHERE id = $1', [id]);

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.PRODUCT_UPDATED,
      data: {
        ...updatedProduct,
        _id: updatedProduct.id,
        id: undefined
      },
    });
  } catch (err) {
    console.error('updateProduct error:', err.message);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Private
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existing = await dbGet('SELECT * FROM products WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.NOT_FOUND,
      });
    }

    // Delete product (foreign key cascade will handle sale_products)
    const result = await dbRun('DELETE FROM products WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(500).json({
        success: false,
        message: ERROR_MESSAGES.SERVER_ERROR,
      });
    }

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.PRODUCT_DELETED,
      data: {},
    });
  } catch (err) {
    console.error('deleteProduct error:', err.message);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};
