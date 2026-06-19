const { dbGet, dbRun, dbAll } = require('../config/supabase');
const bcrypt = require('bcryptjs');

// @desc    Register new company
// @route   POST /api/companies/register
// @access  Public
exports.registerCompany = async (req, res) => {
  try {
    const {
      companyName,
      slug,
      adminEmail,
      adminPassword,
      phone,
      email,
      address,
      industry
    } = req.body;

    // Validate input
    if (!companyName || !slug || !adminEmail || !adminPassword) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: companyName, slug, adminEmail, adminPassword'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admin email format'
      });
    }

    // Validate slug format (lowercase, no spaces, alphanumeric and hyphens only)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return res.status(400).json({
        success: false,
        message: 'Slug must be lowercase, alphanumeric with hyphens only'
      });
    }

    // Check if slug already exists
    const existingCompany = await dbGet(
      'SELECT id FROM companies WHERE slug = $1',
      [slug.toLowerCase()]
    );

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Company slug already taken. Please choose a different slug.'
      });
    }

    // Check if admin email already exists
    const existingUser = await dbGet(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please use a different email.'
      });
    }

    // Validate password strength
    if (adminPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Create company
    const company = await dbGet(
      `INSERT INTO companies (name, slug, email, phone, address, industry, subscription_tier, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, slug, email, logo_url, primary_color, created_at`,
      [
        companyName,
        slug.toLowerCase(),
        email || adminEmail,
        phone || null,
        address || null,
        industry || 'General',
        'FREE',
        true
      ]
    );

    if (!company) {
      console.error('❌ Company creation returned null');
      return res.status(500).json({
        success: false,
        message: 'Failed to create company'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create admin user
    const user = await dbGet(
      `INSERT INTO users (email, password, name, role, company_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, name, role, company_id`,
      [
        adminEmail,
        hashedPassword,
        adminEmail.split('@')[0], // Use email prefix as default name
        'admin',
        company.id,
        true
      ]
    );

    if (!user) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create admin user'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Company registered successfully',
      data: {
        company: {
          id: company.id,
          name: company.name,
          slug: company.slug,
          email: company.email,
          logo: company.logo_url,
          primaryColor: company.primary_color,
          createdAt: company.created_at
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        message: `Welcome to ${company.name}! You can now login with your credentials.`
      }
    });
  } catch (err) {
    console.error('Company registration error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @desc    Get company branding
// @route   GET /api/company/branding
// @access  Private
exports.getCompanyBranding = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: 'Company ID not found in token'
      });
    }

    const company = await dbGet(
      'SELECT id, name, logo_url, primary_color, secondary_color FROM companies WHERE id = $1 AND is_active = true',
      [companyId]
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: company.id,
        name: company.name,
        logo: company.logo_url,
        primaryColor: company.primary_color,
        secondaryColor: company.secondary_color
      }
    });
  } catch (err) {
    console.error('Error fetching company branding:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @desc    Update company branding
// @route   PUT /api/company/branding
// @access  Private (Admin only)
exports.updateCompanyBranding = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const userRole = req.user.role;

    // Only admins can update branding
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update company branding'
      });
    }

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: 'Company ID not found in token'
      });
    }

    const { companyName, primaryColor, secondaryColor, logoUrl } = req.body;

    // Validate color format if provided
    if (primaryColor && !/^#[0-9A-F]{6}$/i.test(primaryColor)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid primary color format. Use hex format: #RRGGBB'
      });
    }

    if (secondaryColor && !/^#[0-9A-F]{6}$/i.test(secondaryColor)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid secondary color format. Use hex format: #RRGGBB'
      });
    }

    // Build dynamic update query
    let updateQuery = 'UPDATE companies SET updated_at = NOW()';
    const params = [companyId];
    let paramCount = 1;

    if (companyName) {
      paramCount++;
      updateQuery += `, name = $${paramCount}`;
      params.push(companyName);
    }

    if (primaryColor) {
      paramCount++;
      updateQuery += `, primary_color = $${paramCount}`;
      params.push(primaryColor);
    }

    if (secondaryColor) {
      paramCount++;
      updateQuery += `, secondary_color = $${paramCount}`;
      params.push(secondaryColor);
    }

    if (logoUrl) {
      paramCount++;
      updateQuery += `, logo_url = $${paramCount}`;
      params.push(logoUrl);
    }

    updateQuery += ` WHERE id = $1 RETURNING id, name, logo_url, primary_color, secondary_color, updated_at`;

    const company = await dbGet(updateQuery, params);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      message: 'Company branding updated successfully',
      data: {
        id: company.id,
        name: company.name,
        logo: company.logo_url,
        primaryColor: company.primary_color,
        secondaryColor: company.secondary_color,
        updatedAt: company.updated_at
      }
    });
  } catch (err) {
    console.error('Error updating company branding:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @desc    Get company details
// @route   GET /api/company
// @access  Private
exports.getCompanyDetails = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: 'Company ID not found in token'
      });
    }

    const company = await dbGet(
      'SELECT id, name, slug, email, phone, address, industry, subscription_tier, logo_url, primary_color, secondary_color, is_active, created_at, updated_at FROM companies WHERE id = $1',
      [companyId]
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        email: company.email,
        phone: company.phone,
        address: company.address,
        industry: company.industry,
        subscriptionTier: company.subscription_tier,
        logo: company.logo_url,
        primaryColor: company.primary_color,
        secondaryColor: company.secondary_color,
        isActive: company.is_active,
        createdAt: company.created_at,
        updatedAt: company.updated_at
      }
    });
  } catch (err) {
    console.error('Error fetching company details:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @desc    Update company details
// @route   PUT /api/company
// @access  Private (Admin only)
exports.updateCompanyDetails = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const userRole = req.user.role;

    // Only admins can update details
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update company details'
      });
    }

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: 'Company ID not found in token'
      });
    }

    const { email, phone, address, industry } = req.body;

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
    }

    // Build dynamic update query
    let updateQuery = 'UPDATE companies SET updated_at = NOW()';
    const params = [companyId];
    let paramCount = 1;

    if (email) {
      paramCount++;
      updateQuery += `, email = $${paramCount}`;
      params.push(email);
    }

    if (phone) {
      paramCount++;
      updateQuery += `, phone = $${paramCount}`;
      params.push(phone);
    }

    if (address) {
      paramCount++;
      updateQuery += `, address = $${paramCount}`;
      params.push(address);
    }

    if (industry) {
      paramCount++;
      updateQuery += `, industry = $${paramCount}`;
      params.push(industry);
    }

    updateQuery += ` WHERE id = $1 RETURNING id, name, email, phone, address, industry, updated_at`;

    const company = await dbGet(updateQuery, params);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      message: 'Company details updated successfully',
      data: {
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        address: company.address,
        industry: company.industry,
        updatedAt: company.updated_at
      }
    });
  } catch (err) {
    console.error('Error updating company details:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
