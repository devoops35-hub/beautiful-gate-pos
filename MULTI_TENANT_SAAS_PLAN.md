# Multi-Tenant SaaS Implementation Plan
**Date**: June 10, 2026  
**Project**: Beautiful Gate POS → Multi-Tenant Platform  
**Scope**: Enable multiple companies to use the platform with separate data, branding, and URLs

---

## 🎯 Overview

Convert the current single-tenant POS system into a multi-tenant SaaS platform where:
- Each company registers and gets their own workspace
- Each company has isolated data (no cross-company data visibility)
- Each company can customize their branding (logo, colors, company name)
- Each company accesses their dashboard via company-specific URL or subdomain
- Authentication ties users to their company

---

## 📋 Architecture Changes Required

### 1. Database Schema Changes

#### New Tables Needed
```sql
-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,  -- company-unique-identifier (for URL)
  logo_url TEXT,                       -- S3 or cloud storage URL
  primary_color VARCHAR(7),            -- Brand color #RRGGBB
  secondary_color VARCHAR(7),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  industry VARCHAR(100),               -- POS, Restaurant, Retail, etc.
  subscription_tier VARCHAR(50),       -- FREE, BASIC, PRO, ENTERPRISE
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Modify existing users table
ALTER TABLE users ADD COLUMN company_id UUID REFERENCES companies(id);

-- Modify existing products table
ALTER TABLE products ADD COLUMN company_id UUID REFERENCES companies(id);

-- Modify existing sales table
ALTER TABLE sales ADD COLUMN company_id UUID REFERENCES companies(id);

-- Similar changes for sales_items, audit_logs, etc.
```

#### Data Isolation Strategy
- Add `company_id` to all tenant-specific tables
- All queries must filter by `company_id`
- Database indexes on `company_id` for performance

### 2. Frontend URL Structure

**Option A: Subdomain-based (Recommended)**
```
https://app.beautiful-gate-pos.com/dashboard      (Main app)
https://acme.beautiful-gate-pos.com/dashboard      (Company: ACME)
https://xyz-store.beautiful-gate-pos.com/dashboard (Company: XYZ Store)
```

**Option B: Path-based**
```
https://app.beautiful-gate-pos.com/companies/acme/dashboard
https://app.beautiful-gate-pos.com/companies/xyz-store/dashboard
```

**Option C: Custom domain (Premium feature)**
```
https://pos.acmecompany.com/dashboard
https://pos.xyzstore.com/dashboard
```

### 3. Authentication Changes

**Current Flow**:
```
User → Login → JWT Token → Access Dashboard
```

**New Flow**:
```
User → Register Company → Create Company Account
  ↓
  Company slug created (e.g., "acme-corp")
  ↓
User → Login with Company Slug
  ↓
JWT Token includes: { userId, companyId, companySlug }
  ↓
Access Company-Specific Dashboard
```

---

## 🔧 Implementation Steps

### Phase 1: Database Setup (4-6 hours)

**Step 1.1**: Create Companies Table
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#0084FF',
  secondary_color VARCHAR(7) DEFAULT '#4CAF50',
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  industry VARCHAR(100),
  subscription_tier VARCHAR(50) DEFAULT 'FREE',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Step 1.2**: Migrate Existing Data
```sql
-- Add company_id column to users (nullable initially)
ALTER TABLE users ADD COLUMN company_id UUID;

-- Create default company for existing data
INSERT INTO companies (name, slug, email) 
VALUES ('Beautiful Gate', 'beautiful-gate', 'info@beautifulgate.com');

-- Update users to reference the default company
UPDATE users SET company_id = (SELECT id FROM companies WHERE slug = 'beautiful-gate');

-- Make company_id NOT NULL
ALTER TABLE users ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id);
```

**Step 1.3**: Add company_id to Other Tables
```sql
ALTER TABLE products ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE sales ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE sales_items ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE audit_logs ADD COLUMN company_id UUID REFERENCES companies(id);

-- Backfill existing data
UPDATE products SET company_id = (SELECT id FROM companies WHERE slug = 'beautiful-gate');
UPDATE sales SET company_id = (SELECT id FROM companies WHERE slug = 'beautiful-gate');
-- etc.
```

### Phase 2: Backend API Changes (8-10 hours)

**Step 2.1**: Create Company Registration Endpoint
```javascript
// server/routes/companies.js
POST /api/companies/register
{
  "companyName": "ACME Corporation",
  "slug": "acme-corp",                    // Auto-generated from name if not provided
  "email": "admin@acme.com",
  "adminName": "John Doe",
  "adminEmail": "john@acme.com",
  "adminPassword": "securepassword",
  "phone": "+233501234567",
  "address": "123 Business St, Accra",
  "industry": "Retail"
}
```

**Step 2.2**: Modify Auth Endpoints
```javascript
// Updated login response
POST /api/auth/login
{
  "token": "JWT_TOKEN",
  "companyId": "uuid-xxx",
  "companySlug": "acme-corp",
  "companyName": "ACME Corporation",
  "companyLogo": "https://...",
  "user": { ... }
}
```

**Step 2.3**: Create Tenant Context Middleware
```javascript
// server/middleware/tenantMiddleware.js
const extractTenantFromRequest = (req) => {
  // From JWT token
  const companyId = req.user.companyId;
  const companySlug = req.user.companySlug;
  
  // Validate tenant is active
  // Set req.tenant = { id: companyId, slug: companySlug }
  // All queries will automatically filter by this
};
```

**Step 2.4**: Update All Controllers to Filter by Tenant
```javascript
// Before:
const products = await dbAll('SELECT * FROM products');

// After:
const products = await dbAll(
  'SELECT * FROM products WHERE company_id = $1',
  [req.tenant.id]
);
```

**Step 2.5**: Create Company Settings Endpoint
```javascript
// Get company branding info
GET /api/company/branding
{
  "logo": "https://...",
  "primaryColor": "#0084FF",
  "secondaryColor": "#4CAF50",
  "companyName": "ACME Corporation"
}

// Update company branding
PUT /api/company/branding
{
  "logo": "file",                   // Multipart upload
  "primaryColor": "#FF6B6B",
  "secondaryColor": "#4ECDC4"
}
```

**Step 2.6**: Logo Upload Handling
```javascript
// Use AWS S3, Cloudinary, or similar
// Store in: s3://company-logos/{companyId}/logo.png
// Or: cloudinary: company-{companyId}/logo
```

### Phase 3: Frontend Changes (10-12 hours)

**Step 3.1**: Update Login Page
```javascript
// client/src/pages/LoginPage.jsx
- Add "Company Name/Slug" input field
- Auto-generate slug from name
- OR provide slug input for existing companies

Flow:
1. User enters company slug (or name to get slug)
2. Redirected to company login page
3. User enters email/password
4. Authenticated to company workspace
```

**Step 3.2**: Create Company Registration Page
```javascript
// client/src/pages/RegisterCompanyPage.jsx
- Company name input
- Company slug input (auto-generate or manual)
- Admin user email
- Admin user password
- Company contact info (optional)
- Logo upload field (optional)
```

**Step 3.3**: Dynamic Logo Loading
```javascript
// client/src/components/Header.jsx
useEffect(() => {
  // Get company branding from API
  const fetchCompanyBranding = async () => {
    const branding = await api.company.getBranding();
    setLogoUrl(branding.logo);
    setPrimaryColor(branding.primaryColor);
    setCompanyName(branding.companyName);
  };
}, []);

// In JSX:
<img src={logoUrl} alt={companyName} />
<style>{`
  :root {
    --primary-color: ${primaryColor};
  }
`}</style>
```

**Step 3.4**: URL-based Routing
```javascript
// client/src/App.jsx
// Detect company from URL
const getCompanySlugFromUrl = () => {
  // Subdomain: acme.app.example.com → 'acme'
  const subdomain = window.location.hostname.split('.')[0];
  return subdomain !== 'app' ? subdomain : null;
};

// In component:
<BrowserRouter>
  <Routes>
    <Route path="/" element={<LoginPage companySlug={getCompanySlugFromUrl()} />} />
    <Route path="/dashboard" element={<Dashboard />} />
    ...
  </Routes>
</BrowserRouter>
```

**Step 3.5**: Auth Context Update
```javascript
// client/src/context/AuthContext.jsx
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);  // NEW
  
  const login = async (email, password, companySlug) => {
    const response = await api.auth.login({
      email,
      password,
      companySlug
    });
    
    setUser(response.user);
    setCompany({                          // NEW
      id: response.companyId,
      slug: response.companySlug,
      name: response.companyName,
      logo: response.companyLogo
    });
  };
  
  return (
    <AuthContext.Provider value={{ user, company, login }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Phase 4: Deployment & Infrastructure (6-8 hours)

**Step 4.1**: Subdomain Setup (if using subdomain approach)
```
DNS Records needed:
*.beautiful-gate-pos.com  A  <Render_IP>

This creates a wildcard: any subdomain points to same server
acme.beautiful-gate-pos.com → Render → Routes to company workspace
```

**Step 4.2**: Environment Variables
```
MULTI_TENANT_ENABLED=true
SUBDOMAIN_MODE=true                      # or PATH_MODE, CUSTOM_DOMAIN
LOGO_STORAGE=AWS_S3 | CLOUDINARY         # Where to store logos
AWS_S3_BUCKET=company-logos
AWS_REGION=us-east-1
```

**Step 4.3**: Rate Limiting per Company
```javascript
// Prevent one company from flooding the system
const tenantRateLimiter = (req, res, next) => {
  // Limit by: req.tenant.id (company ID)
  // Not just IP address
};
```

---

## 📊 Data Flow Diagram

```
REGISTRATION FLOW:
┌─────────────────────────────────────────┐
│ Company Registration                    │
├─────────────────────────────────────────┤
│ 1. User clicks "Register New Company"   │
│ 2. Fills company details                │
│ 3. Creates admin user account           │
│ 4. Company slug generated               │
│ 5. Company created in DB                │
│ 6. Admin user linked to company         │
│ 7. Redirect to dashboard                │
└─────────────────────────────────────────┘

LOGIN FLOW:
┌─────────────────────────────────────────┐
│ URL: acme.app.example.com               │
├─────────────────────────────────────────┤
│ 1. Frontend detects subdomain: "acme"   │
│ 2. Shows login form (acme branding)     │
│ 3. User enters email/password           │
│ 4. Backend validates + checks company   │
│ 5. Returns JWT with companyId           │
│ 6. Load company logo and colors         │
│ 7. Show company-specific dashboard      │
└─────────────────────────────────────────┘

DATA ISOLATION:
┌─────────────────────────────────────────┐
│ Query for products                      │
├─────────────────────────────────────────┤
│ SELECT * FROM products                  │
│ WHERE company_id = $1  ← KEY LINE       │
│                                         │
│ Ensures ACME only sees ACME products    │
│ XYZ Store only sees XYZ products        │
│ No cross-company data leakage           │
└─────────────────────────────────────────┘
```

---

## 🔒 Security Considerations

### 1. Data Isolation
- ✅ Every query filters by `company_id`
- ✅ User can only see/modify their company's data
- ✅ Database constraints prevent cross-company access

### 2. Authentication
- ✅ JWT includes `companyId`
- ✅ Validate company_id on every request
- ✅ Middleware prevents tenant mixing

### 3. Multi-Tenancy Risks & Mitigations
```
Risk: Company A user accesses Company B data
Mitigation: Tenant middleware on all routes

Risk: SQL injection exposes other companies' data
Mitigation: Parameterized queries (already using)

Risk: User modifies JWT to different companyId
Mitigation: Backend validates JWT against database

Risk: Logo upload from one company overwrites another's
Mitigation: Use unique S3 paths per company: s3://bucket/{companyId}/logo.png
```

---

## 📱 User Experience Flow

### For First-Time Users (Company Registration)

```
1. Visit: https://app.beautiful-gate-pos.com
   ↓
2. Click "Register New Company"
   ↓
3. Fill form:
   - Company Name: "ACME Corporation"
   - Slug: "acme" (auto-generated)
   - Admin Email: john@acme.com
   - Admin Password: ••••••••
   - Phone: +233501234567
   ↓
4. Click "Create Company"
   ↓
5. Company created, admin logged in
   ↓
6. Redirected to: https://acme.app.beautiful-gate-pos.com/dashboard
   ↓
7. Upload company logo (optional)
   ↓
8. Customize colors (optional)
   ↓
9. Ready to use!
```

### For Existing Users (Company Login)

```
1. Visit: https://acme.app.beautiful-gate-pos.com
   ↓
2. See "ACME Corporation" logo & branding
   ↓
3. Enter email & password
   ↓
4. Login to ACME workspace
   ↓
5. See ACME's products, sales, dashboard
   ↓
6. All data isolated to ACME
```

---

## 🎨 Logo & Branding Implementation

### Logo Upload
```javascript
// Frontend
<form encType="multipart/form-data">
  <input type="file" accept="image/*" />
  <button onClick={uploadLogo}>Upload Logo</button>
</form>

// Backend receives file
POST /api/company/upload-logo
- File stored in S3 at: company-logos/{companyId}/logo.png
- URL stored in companies table: logo_url
- Return: { success: true, logoUrl: "https://..." }

// Frontend displays
<img src={logoUrl} alt="Company Logo" />
```

### Dynamic Styling
```css
/* App.css */
:root {
  --primary-color: var(--company-primary-color, #0084FF);
  --secondary-color: var(--company-secondary-color, #4CAF50);
}

/* Set from company data */
document.documentElement.style.setProperty(
  '--company-primary-color',
  companyBranding.primaryColor
);
```

### Company Name Display
```javascript
// Show company name in header
<Header companyName={company.name} logo={company.logo} />

// In Footer
<Footer companyName={company.name} />
```

---

## 📊 Database Schema Summary

```
Before (Single-Tenant):
┌────────────┐  ┌──────────┐  ┌────────┐
│   users    │  │ products │  │ sales  │
├────────────┤  ├──────────┤  ├────────┤
│ id         │  │ id       │  │ id     │
│ email      │  │ name     │  │ total  │
│ password   │  │ price    │  │ date   │
└────────────┘  └──────────┘  └────────┘

After (Multi-Tenant):
┌──────────────┐
│  companies   │
├──────────────┤
│ id (PK)      │
│ name         │
│ slug (UNIQUE)│
│ logo_url     │
└──────────────┘
      ↑
      │ company_id
      │
┌────────────────────┬──────────────────┬────────────────┐
│     users          │    products      │     sales      │
├────────────────────┼──────────────────┼────────────────┤
│ id                 │ id               │ id             │
│ company_id (FK) ←──┼─ company_id (FK) ├─ company_id(FK)│
│ email              │ name             │ total          │
│ password           │ price            │ date           │
└────────────────────┴──────────────────┴────────────────┘
```

---

## 💰 Pricing Tiers (Optional)

```
subscription_tier options:

FREE
- 5 users
- 100 products
- 1,000 sales/month
- Basic support

BASIC ($29/month)
- 20 users
- 500 products
- 10,000 sales/month
- Email support

PRO ($99/month)
- Unlimited users
- Unlimited products
- Unlimited sales
- Priority support
- Custom branding

ENTERPRISE (Custom)
- Everything in PRO
- Dedicated support
- Custom domain
- API access
- SSO integration
```

---

## 📋 Implementation Checklist

### Phase 1: Database
- [ ] Create companies table
- [ ] Add company_id to all tenant tables
- [ ] Create indexes on company_id
- [ ] Write migration scripts
- [ ] Test data isolation

### Phase 2: Backend
- [ ] Create company registration endpoint
- [ ] Create company settings endpoints
- [ ] Add tenant middleware
- [ ] Update all controllers for filtering
- [ ] Create logo upload handler
- [ ] Update auth endpoints
- [ ] Add company branding endpoint

### Phase 3: Frontend
- [ ] Create registration page
- [ ] Update login page
- [ ] Add company branding context
- [ ] Dynamic logo loading
- [ ] URL-based company detection
- [ ] Update all components for branding

### Phase 4: Testing
- [ ] Integration tests
- [ ] Data isolation tests
- [ ] Security tests
- [ ] Load tests
- [ ] User acceptance testing

### Phase 5: Deployment
- [ ] DNS setup (subdomains)
- [ ] Environment config
- [ ] Database migration
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Monitor for issues

---

## 🚀 Estimated Timeline

| Phase | Task | Duration |
|-------|------|----------|
| 1 | Database schema & migration | 1-2 days |
| 2 | Backend API changes | 2-3 days |
| 3 | Frontend UI changes | 2-3 days |
| 4 | Testing & QA | 1-2 days |
| 5 | Deployment | 1 day |
| **Total** | **Full Implementation** | **7-11 days** |

---

## 🎯 Benefits

✅ **Scalability**: Host unlimited companies on one platform
✅ **Revenue**: Charge per company or per user
✅ **Customization**: Each company has own branding
✅ **Isolation**: Data completely separated
✅ **Efficiency**: Single codebase for all companies
✅ **Maintenance**: One system to maintain, not multiple

---

## ❓ Questions to Answer

1. **Subdomain vs Path?** 
   - Subdomain (acme.app.com) feels more professional
   - Path (app.com/acme) is simpler to setup

2. **Logo Storage?**
   - AWS S3 - production grade
   - Cloudinary - easier, CDN included
   - Local storage - not scalable

3. **Custom Domains?**
   - Premium feature (Company gets pos.acmecorp.com)
   - Requires wildcard SSL certificate
   - More infrastructure complexity

4. **Free Trial?**
   - All companies start on FREE tier
   - Can upgrade to BASIC/PRO
   - Reduces friction for onboarding

5. **Payment Processing?**
   - Stripe for SaaS billing
   - Charge per company per month
   - Automate invoicing & upgrades

---

## 🔗 Next Steps

1. **Decide**: Subdomain vs Path approach
2. **Plan**: Choose logo storage (S3, Cloudinary, etc.)
3. **Design**: Database migration strategy
4. **Implement**: Start with Phase 1 (Database)
5. **Test**: Thoroughly test data isolation
6. **Deploy**: Gradual rollout

---

**This is a complete SaaS transformation. Do you want me to:**
1. Create a detailed implementation spec for one phase?
2. Build the registration API endpoint?
3. Create the database migration scripts?
4. Build the frontend registration page?

Let me know which phase you'd like to start with!
