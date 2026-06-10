const { dbRun, dbGet, dbAll } = require('../config/supabase');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../config/constants');
const paystack = require('../config/paystack');

/**
 * Helper to save a sale and its products to database
 */
const saveSaleToDb = async (products, total, paymentMethod, customerEmail, customerPhone) => {
  try {
    console.log('saveSaleToDb starting with:', {
      productsLength: products.length,
      total,
      paymentMethod,
    });

    // Validate products array structure
    for (let i = 0; i < products.length; i++) {
      const item = products[i];
      console.log(`Product ${i}:`, item);
      if (!item.product || item.product === undefined) {
        throw new Error(`Product ${i} missing 'product' field. Got: ${JSON.stringify(item)}`);
      }
      if (!item.quantity || item.quantity === undefined) {
        throw new Error(`Product ${i} missing 'quantity' field. Got: ${JSON.stringify(item)}`);
      }
      if (!item.price || item.price === undefined) {
        throw new Error(`Product ${i} missing 'price' field. Got: ${JSON.stringify(item)}`);
      }
    }

    // Insert the sale record
    const saleResult = await dbRun(
      `INSERT INTO sales (total, payment_method, customer_email, customer_phone) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [
        parseFloat(total),
        paymentMethod,
        customerEmail || null,
        customerPhone || null
      ]
    );
    
    console.log('Sale inserted, result:', saleResult);
    const saleId = saleResult.lastID;

    if (!saleId) {
      throw new Error('Failed to create sale - no ID returned');
    }

    console.log('Processing products, saleId:', saleId);

    // Insert each product reference into sale_products and update product inventory
    const insertedProducts = [];
    for (const item of products) {
      console.log('Processing product item:', item);
      
      // Verify product exists
      const existingProduct = await dbGet('SELECT id, quantity FROM products WHERE id = $1', [item.product]);
      console.log('Existing product check:', existingProduct);
      
      if (!existingProduct) {
        throw new Error(`Product with ID ${item.product} not found in database`);
      }
      
      await dbRun(
        `INSERT INTO sale_products (sale_id, product_id, quantity, price) 
         VALUES ($1, $2, $3, $4)`,
        [saleId, item.product, parseInt(item.quantity), parseFloat(item.price)]
      );

      console.log('Sale product inserted');
      
      // Deduct stock quantity in the products table
      const newQuantity = Math.max(0, existingProduct.quantity - parseInt(item.quantity));
      console.log('Updating product quantity to:', newQuantity);
      await dbRun(
        `UPDATE products SET quantity = $1 WHERE id = $2`,
        [newQuantity, item.product]
      );
      
      console.log('Product quantity updated');

      insertedProducts.push({
        product: item.product,
        quantity: item.quantity,
        price: item.price
      });
    }

    console.log('Fetching created sale record');
    // Retrieve the created sale info
    const sale = await dbGet('SELECT * FROM sales WHERE id = $1', [saleId]);
    console.log('Sale record retrieved:', sale);
    
    if (!sale) {
      console.warn('Sale record not found after insertion, but sale creation succeeded');
      // Return a minimal sale object
      return {
        id: saleId,
        total: total,
        payment_method: paymentMethod,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        products: insertedProducts
      };
    }
    
    return {
      ...sale,
      products: insertedProducts
    };
  } catch (error) {
    console.error('Error saving sale to database:', error);
    throw error;
  }
};

/**
 * @desc    Create a new sale
 * @route   POST /api/sales
 * @access  Private
 */
exports.createSale = async (req, res) => {
  try {
    const { products, total, paymentMethod, customerEmail, customerPhone } = req.body;

    // Validate input
    if (!products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Sale must contain at least one product',
      });
    }

    if (!total || total <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid total amount',
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required',
      });
    }

    // For cash/mobile money payments, save the sale directly
    if (paymentMethod === 'Cash' || paymentMethod === 'Mobile Money') {
      try {
        const savedSale = await saveSaleToDb(
          products,
          total,
          paymentMethod,
          customerEmail || null,
          customerPhone || null
        );

        const responseData = {
          id: savedSale?.id || null,
          total: parseFloat(total),
          payment_method: paymentMethod,
        };

        return res.status(201).json({
          success: true,
          message: SUCCESS_MESSAGES.SALE_CREATED,
          data: responseData
        });
      } catch (saveError) {
        console.error('Error in createSale:', saveError);
        throw saveError;
      }
    }

    // For card/transfer payments (Paystack integration)
    try {
      const transaction = await paystack.transaction.initialize({
        amount: Math.round(total * 100),
        currency: 'GHS',
        email: customerEmail || 'customer@example.com',
        metadata: {
          paymentMethod: paymentMethod,
          products: products
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Paystack transaction initialized',
        data: {
          paystackTransaction: transaction.data,
        }
      });
    } catch (paystackError) {
      console.error('Paystack Error:', paystackError);
      return res.status(400).json({
        success: false,
        message: 'Failed to initialize payment transaction',
      });
    }
  } catch (err) {
    console.error('createSale error:', err);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

/**
 * @desc    Verify Paystack transaction and save sale
 * @route   POST /api/sales/verify/:reference
 * @access  Private
 */
exports.verifyTransaction = async (req, res) => {
  try {
    const { reference } = req.params;
    const { products, total, paymentMethod, customerEmail, customerPhone } = req.body;

    console.log('verifyTransaction called with:', {
      reference,
      productsLength: products?.length,
      total,
      paymentMethod,
      customerEmail,
      customerPhone,
    });

    // Validate input
    if (!products || products.length === 0) {
      console.warn('No products provided');
      return res.status(400).json({
        success: false,
        message: 'Sale must contain at least one product',
      });
    }

    if (!total || total <= 0) {
      console.warn('Invalid total:', total);
      return res.status(400).json({
        success: false,
        message: 'Invalid total amount',
      });
    }

    if (!paymentMethod) {
      console.warn('No payment method');
      return res.status(400).json({
        success: false,
        message: 'Payment method is required',
      });
    }

    // For Mobile Money/Cash payments, save sale directly without verification
    if (paymentMethod === 'Mobile Money' || paymentMethod === 'Cash') {
      console.log('Processing Mobile Money/Cash payment - saving directly');
      try {
        const savedSale = await saveSaleToDb(
          products,
          total,
          paymentMethod,
          customerEmail,
          customerPhone
        );
        
        console.log('Sale saved successfully with ID:', savedSale?.id);
        
        // Return a minimal clean response
        const responseData = {
          id: savedSale?.id || null,
          total: parseFloat(total),
          payment_method: paymentMethod,
        };
        
        return res.status(200).json({
          success: true,
          message: SUCCESS_MESSAGES.SALE_CREATED,
          data: responseData,
        });
      } catch (saveError) {
        console.error('Error saving sale in verify:', saveError);
        throw saveError;
      }
    }

    // For card/transfer payments, verify with Paystack
    try {
      console.log('Verifying Paystack transaction:', reference);
      const verification = await paystack.transaction.verify(reference);
      
      if (verification.data.status === 'success') {
        // Save the sale after successful payment
        const savedSale = await saveSaleToDb(
          products,
          total,
          paymentMethod,
          customerEmail,
          customerPhone
        );
        
        const responseData = {
          id: savedSale?.id || null,
          total: parseFloat(total),
          payment_method: paymentMethod,
        };
        
        return res.status(200).json({
          success: true,
          message: SUCCESS_MESSAGES.SALE_CREATED,
          data: responseData,
        });
      } else {
        console.warn('Paystack verification failed:', verification.data.status);
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed',
        });
      }
    } catch (paystackError) {
      console.error('Paystack verification error:', paystackError);
      return res.status(400).json({
        success: false,
        message: 'Failed to verify payment with Paystack',
      });
    }
  } catch (err) {
    console.error('verifyTransaction error:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      error: err.message,
    });
  }
};

/**
 * @desc    Get all sales
 * @route   GET /api/sales
 * @access  Private
 */
exports.getSales = async (req, res) => {
  try {
    const sales = await dbAll('SELECT * FROM sales ORDER BY created_at DESC');
    res.status(200).json({
      success: true,
      message: 'Sales retrieved successfully',
      data: sales,
    });
  } catch (err) {
    console.error('getSales error:', err.message);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};
