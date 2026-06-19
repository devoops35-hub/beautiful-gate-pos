const { dbGet } = require('../config/supabase');

/**
 * Verify tenant (company) and add to request
 * Ensures user's company exists and is active
 * Prevents data leakage between companies
 */
const verifyTenant = async (req, res, next) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: 'Company ID not found in authentication token'
      });
    }

    // Verify company exists and is active
    const company = await dbGet(
      'SELECT id, is_active FROM companies WHERE id = $1',
      [companyId]
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    if (!company.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Company is inactive or suspended'
      });
    }

    // Add tenant information to request for use in controllers
    req.tenant = {
      id: company.id,
      companyId: company.id
    };

    next();
  } catch (err) {
    console.error('Tenant verification error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during tenant verification'
    });
  }
};

module.exports = { verifyTenant };
