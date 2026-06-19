# Multi-Tenant SaaS Quick Start Guide
**For**: Beautiful Gate POS  
**Goal**: Enable multiple companies with separate data, logos, and custom URLs

---

## 🎯 What You're Building

**Current State**: One POS system for Beautiful Gate  
**Future State**: Platform where many companies register and get their own:
- ✅ Custom workspace URL (e.g., acme.app.com)
- ✅ Custom logo upload
- ✅ Custom company name
- ✅ Completely isolated data (products, sales, users)
- ✅ Role-based access control within company

---

## 🚀 Simplest Implementation Path (Start Here)

### Step 1: Create Companies Table (30 minutes)

Run this SQL in Supabase:

```sql
-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#0084FF',
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add company_id to users
ALTER TABLE users ADD COLUMN company_id UUID REFERENCES companies(id);

-- Add company_id to products
ALTER TABLE products ADD COLUMN company_id UUID REFERENCES companies(id);

-- Add company_id to sales
ALTER TABLE sales ADD COLUMN company_id UUID REFERENCES companies(id);

-- Create indexes for performance
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_products_company_id ON products(company_id);
CREATE INDEX idx_sales_company_id ON sales(company_id);
```

### Step 2: Backfill Existing Data (15 minutes)

```sql
-- Create default company for existing data
INSERT INTO companies (name, slug, email)
VALUES ('Beautiful Gate', 'beautiful-gate', 'info@beautifulgate.com')
RETURNING id;

-- Copy the returned ID and use it below:
UPDATE users SET company_id = 'PASTE_UUID_HERE';
UPDATE products SET company_id = 'PASTE_UUID_HERE';
UPDATE sales SET company_id = 'PASTE_UUID_HERE';

-- Make company_id NOT NULL
ALTER TABLE users ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE products ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE sales ALTER COLUMN company_id SET NOT NULL;
```

### Step 3: Add Company Registration API (1-2 hours)

Create new file: `server/controllers/companyController.js`

```javascript
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
      email
    } = req.body;

    // Validate input
    if (!companyName || !slug || !adminEmail || !adminPassword) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
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
        message: 'Company slug already taken'
      });
    }

    // Check if email already exists
    const existingUser = await dbGet(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create company
    const company = await dbGet(
      `INSERT INTO companies (name, slug, email, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [companyName, slug.toLowerCase(), email || adminEmail, phone]
    );

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create admin user
    const user = await dbGet(
      `INSERT INTO users (email, password, name, role, company_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, name, role`,
      [adminEmail, hashedPassword, adminEmail, 'admin', company.id, true]
    );

    res.status(201).json({
      success: true,
      message: 'Company registered successfully',
      data: {
        company,
        user
      }
    });
  } catch (err) {
    console.error('Company registration error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Get company branding
// @route   GET /api/company/branding
// @access  Private
exports.getCompanyBranding = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const company = await dbGet(
      'SELECT id, name, logo_url, primary_color FROM companies WHERE id = $1',
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
        name: company.name,
        logo: company.logo_url,
        primaryColor: company.primary_color
      }
    });
  } catch (err) {
    console.error('Error fetching company branding:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update company branding
// @route   PUT /api/company/branding
// @access  Private
exports.updateCompanyBranding = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { companyName, primaryColor, logoUrl } = req.body;

    let updateQuery = 'UPDATE companies SET updated_at = NOW()';
    const params = [companyId];

    if (companyName) {
      updateQuery += `, name = $${params.length + 1}`;
      params.push(companyName);
    }

    if (primaryColor) {
      updateQuery += `, primary_color = $${params.length + 1}`;
      params.push(primaryColor);
    }

    if (logoUrl) {
      updateQuery += `, logo_url = $${params.length + 1}`;
      params.push(logoUrl);
    }

    updateQuery += ` WHERE id = $1 RETURNING *`;

    const company = await dbGet(updateQuery, params);

    res.json({
      success: true,
      message: 'Company branding updated',
      data: company
    });
  } catch (err) {
    console.error('Error updating company branding:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
```

Create new file: `server/routes/companies.js`

```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const {
  registerCompany,
  getCompanyBranding,
  updateCompanyBranding
} = require('../controllers/companyController');

// Public route - register new company
router.post('/register', registerCompany);

// Protected routes
router.get('/branding', authenticate, getCompanyBranding);
router.put('/branding', authenticate, updateCompanyBranding);

module.exports = router;
```

Add to `server/index.js`:

```javascript
// Add with other route imports
const companiesRoutes = require('./routes/companies');

// Add with other route definitions
app.use('/api/companies', companiesRoutes);
```

### Step 4: Update Auth Controller (30 minutes)

Modify `server/controllers/authController.js` login method:

```javascript
// In loginUser function, change the response:

// Add company data to JWT
const token = jwt.sign(
  {
    userId: user.id,
    email: user.email,
    role: user.role,
    companyId: user.company_id,  // ADD THIS
    companySlug: company.slug     // ADD THIS
  },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }
);

// Return company info in response
res.json({
  success: true,
  message: 'Login successful',
  token,
  user: {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  },
  company: {
    id: company.id,
    name: company.name,
    slug: company.slug,
    logo: company.logo_url
  }
});
```

### Step 5: Update Controllers to Filter by Company (2-3 hours)

**Pattern: Add WHERE company_id = $X to all queries**

Example - `server/controllers/productController.js`:

```javascript
// Get all products - BEFORE
exports.getAllProducts = async (req, res) => {
  try {
    const products = await dbAll('SELECT * FROM products');
    // ...
  }
};

// Get all products - AFTER
exports.getAllProducts = async (req, res) => {
  try {
    const companyId = req.user.companyId;  // Get from JWT
    const products = await dbAll(
      'SELECT * FROM products WHERE company_id = $1 ORDER BY name',
      [companyId]
    );
    // ...
  }
};
```

Apply same pattern to:
- `getProductById` - filter by company_id
- `createProduct` - set company_id from JWT
- `updateProduct` - verify product belongs to user's company
- `deleteProduct` - verify product belongs to user's company

Similar for sales, users, etc.

### Step 6: Add Tenant Middleware (15 minutes)

Create: `server/middleware/tenantMiddleware.js`

```javascript
const { dbGet } = require('../config/supabase');

// Verify user's company exists and is active
const verifyTenant = async (req, res, next) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: 'Company ID not found in token'
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
        message: 'Company is inactive'
      });
    }

    // Add to request for use in controllers
    req.tenant = {
      id: company.id,
      companyId: company.id
    };

    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = { verifyTenant };
```

Apply to all protected routes in `server/index.js`:

```javascript
const { verifyTenant } = require('./middleware/tenantMiddleware');

// Apply to all API routes that need tenant verification
app.use('/api/products', verifyTenant, productRoutes);
app.use('/api/sales', verifyTenant, salesRoutes);
app.use('/api/dashboard', verifyTenant, dashboardRoutes);
// etc.
```

### Step 7: Update Frontend Auth Context (30 minutes)

Modify: `client/src/context/AuthContext.jsx`

```javascript
import React, { createContext, useState } from 'react';
import { api } from '../config/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);  // ADD THIS
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    try {
      const response = await api.auth.login({ email, password });

      setUser(response.user);
      setCompany({                          // ADD THIS
        id: response.company?.id,
        name: response.company?.name,
        slug: response.company?.slug,
        logo: response.company?.logo
      });

      localStorage.setItem('token', response.token);
      return response;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setCompany(null);              // ADD THIS
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, company, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Step 8: Update Header Component (20 minutes)

Modify: `client/src/components/Header.jsx`

```javascript
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Header = () => {
  const { company } = useContext(AuthContext);

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center">
          {company?.logo ? (
            <img 
              src={company.logo} 
              alt={company.name}
              className="h-10 w-auto"
            />
          ) : (
            <div className="text-xl font-bold">{company?.name || 'POS'}</div>
          )}
        </div>

        {/* Company Name */}
        <div className="text-center flex-1">
          <h1 className="text-xl font-bold">{company?.name}</h1>
        </div>

        {/* User Section */}
        <div className="flex items-center space-x-4">
          {/* existing user menu */}
        </div>
      </div>
    </header>
  );
};

export default Header;
```

### Step 9: Create Registration Page (1 hour)

Create: `client/src/pages/RegisterCompanyPage.jsx`

```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import toast from 'react-hot-toast';

const RegisterCompanyPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    slug: '',
    adminEmail: '',
    adminPassword: '',
    adminConfirmPassword: '',
    phone: '',
    email: ''
  });

  // Auto-generate slug from company name
  const handleCompanyNameChange = (e) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    setFormData({
      ...formData,
      companyName: name,
      slug: slug
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.adminPassword !== formData.adminConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await api.companies.register({
        companyName: formData.companyName,
        slug: formData.slug,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        phone: formData.phone,
        email: formData.email
      });

      toast.success('Company registered successfully!');
      
      // Redirect to login
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-800">
          Register Company
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Create your company workspace
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={handleCompanyNameChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., ACME Corporation"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Slug (auto-generated)
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., acme-corp"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your workspace: {formData.slug || 'slug'}.app.beautiful-gate-pos.com
            </p>
          </div>

          {/* Admin Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Email
            </label>
            <input
              type="email"
              required
              value={formData.adminEmail}
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="admin@company.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.adminPassword}
              onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={formData.adminConfirmPassword}
              onChange={(e) => setFormData({ ...formData, adminConfirmPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone (optional)
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="+233501234567"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating Company...' : 'Create Company'}
          </button>

          {/* Link to Login */}
          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:underline"
            >
              Login here
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterCompanyPage;
```

### Step 10: Update API Client (15 minutes)

Modify: `client/src/config/api.js`

```javascript
// Add companies API
const companies = {
  register: (data) => client.post('/companies/register', data),
  getBranding: () => client.get('/company/branding'),
  updateBranding: (data) => client.put('/company/branding', data)
};

// Update export
export const api = {
  auth,
  products,
  sales,
  dashboard,
  settings,
  companies  // ADD THIS
};
```

### Step 11: Update Router (10 minutes)

Modify: `client/src/App.jsx`

```javascript
import RegisterCompanyPage from './pages/RegisterCompanyPage';

// Add route
<Route path="/register-company" element={<RegisterCompanyPage />} />

// Add link on login page
<Link to="/register-company" className="text-blue-600 hover:underline">
  Register a new company
</Link>
```

---

## 📊 Implementation Timeline

| Step | Task | Time |
|------|------|------|
| 1 | Database setup | 30 min |
| 2 | Backfill data | 15 min |
| 3 | Company registration API | 1-2 hrs |
| 4 | Update auth controller | 30 min |
| 5 | Filter queries by company | 2-3 hrs |
| 6 | Tenant middleware | 15 min |
| 7 | Frontend auth context | 30 min |
| 8 | Update header | 20 min |
| 9 | Registration page | 1 hr |
| 10 | API client | 15 min |
| 11 | Router | 10 min |
| **Total** | | **6-8 hours** |

---

## ✅ Testing Checklist

After implementation:

- [ ] Company A registers and gets workspace
- [ ] Company B registers with different workspace
- [ ] Company A cannot see Company B's products
- [ ] Company A cannot see Company B's sales
- [ ] Logo uploads work
- [ ] Company name displays correctly in header
- [ ] JWT contains company_id
- [ ] Tenant middleware prevents data leakage
- [ ] Database constraints enforced

---

## 🚀 Next Steps

Want me to:
1. Build the company registration API right now?
2. Create the database migration script?
3. Build the registration page component?
4. Set up URL subdomain routing?

Let me know which you'd like to start with!
