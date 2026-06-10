const { dbAll, dbGet, dbRun } = require('../config/supabase');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Public
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Get total products count
    const prodCountResult = await dbGet('SELECT COUNT(*) as count FROM products');
    const totalProducts = prodCountResult?.count || 0;
    
    // 2. Get total sales and revenue
    const sales = await dbAll('SELECT * FROM sales ORDER BY created_at DESC');
    const totalSales = sales?.length || 0;
    const totalRevenue = sales ? sales.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0) : 0;
    
    // 3. Get recent sales (last 5) with their products
    const recentSales = await dbAll(
      'SELECT * FROM sales ORDER BY created_at DESC LIMIT 5'
    ) || [];
    
    for (const sale of recentSales) {
      const items = await dbAll(
        `SELECT sp.quantity, sp.price, p.id, p.name, p.price as original_price
         FROM sale_products sp
         LEFT JOIN products p ON sp.product_id = p.id
         WHERE sp.sale_id = $1`,
        [sale.id]
      ) || [];
      
      sale.products = items.map(item => ({
        product: {
          id: item.id,
          name: item.name || 'Deleted Product',
          price: item.original_price || item.price
        },
        quantity: item.quantity,
        price: item.price
      }));
    }
    
    // 4. Get top selling products - use fetch-then-compute for Supabase compatibility
    const allSaleProducts = await dbAll(
      'SELECT sp.product_id, sp.quantity FROM sale_products sp'
    ) || [];
    
    // Aggregate by product_id
    const productSalesMap = {};
    for (const item of allSaleProducts) {
      if (!productSalesMap[item.product_id]) {
        productSalesMap[item.product_id] = { count: 0 };
      }
      productSalesMap[item.product_id].count += item.quantity || 1;
    }
    
    // Get all products
    const allProducts = await dbAll('SELECT * FROM products') || [];
    
    // Build top products array
    const topProducts = Object.entries(productSalesMap)
      .map(([productId, data]) => {
        const product = allProducts.find(p => p.id === parseInt(productId));
        return {
          id: parseInt(productId),
          name: product?.name || 'Unknown Product',
          price: product?.price || 0,
          sales_count: data.count
        };
      })
      .sort((a, b) => b.sales_count - a.sales_count)
      .slice(0, 5);
    
    // 5. Group sales data by date for charting
    const salesByDate = {};
    const paymentMethods = {};
    sales.forEach(sale => {
      // Normalize timestamp to date string: YYYY-MM-DD
      let dateStr;
      try {
        const dateObj = new Date(sale.created_at);
        dateStr = dateObj.toISOString().split('T')[0];
      } catch (e) {
        dateStr = sale.created_at ? sale.created_at.split(' ')[0] : 'N/A';
      }
      
      if (!salesByDate[dateStr]) {
        salesByDate[dateStr] = { count: 0, revenue: 0 };
      }
      salesByDate[dateStr].count += 1;
      salesByDate[dateStr].revenue += sale.total || 0;
      
      // Count payment methods
      const method = sale.payment_method || 'Unknown';
      if (!paymentMethods[method]) {
        paymentMethods[method] = 0;
      }
      paymentMethods[method] += 1;
    });
    
    // Convert maps to arrays for the chart component
    const salesChartData = Object.entries(salesByDate)
      .map(([date, data]) => ({
        date,
        count: data.count,
        revenue: data.revenue
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const paymentMethodsChartData = Object.entries(paymentMethods)
      .map(([method, count]) => ({
        method,
        count
      }));
    
    // 6. Get unique customer count
    const customerEmails = sales
      .map(sale => sale.customer_email)
      .filter(email => email && typeof email === 'string');
    const uniqueCustomers = [...new Set(customerEmails)].length;
    
    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalSales,
        totalProducts,
        uniqueCustomers,
        salesChartData,
        paymentMethodsChartData,
        recentSales: recentSales.map(sale => ({
          id: sale.id,
          total: sale.total || 0,
          paymentMethod: sale.payment_method || 'N/A',
          createdAt: sale.created_at,
          products: sale.products || []
        })),
        topProducts
      }
    });
  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
};
