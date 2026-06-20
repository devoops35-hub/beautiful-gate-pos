# Complete Fresh Deployment Guide

**Date**: June 19, 2026  
**Status**: Starting fresh deployment  
**Estimated Time**: 20-30 minutes

---

## Overview

We'll deploy the entire system from scratch:

1. ✅ Frontend (React app on Render)
2. ✅ Backend (Express API on Render)
3. ✅ Database (Supabase PostgreSQL)
4. ✅ Database migration (multi-tenant setup)
5. ✅ Testing (verify everything works)

---

## Part 1: Create Render Services (If Not Exists)

### Option A: If services don't exist yet

1. Go to: https://render.com
2. Click: "New +" → "Web Service"
3. Connect: Select your GitHub repository
4. Name: `beautiful-gate-pos-api` (backend)
5. Environment: Node
6. Build: `npm install && npm run build` (if needed)
7. Start: `npm start`
8. Create

**Repeat** for frontend service with different name and build command

### Option B: If services already exist

Go to: https://dashboard.render.com

For each service (frontend + backend):
1. Click the service
2. Click "Redeploy" button
3. Wait for build (2-3 minutes)

---

## Part 2: Deploy Backend

### Step 1: Trigger Backend Redeploy

```
1. Go to: https://dashboard.render.com
2. Click: beautiful-gate-pos-api
3. Click: "Redeploy" (top right)
4. Wait: 2-3 minutes for 🟢 Live
```

### Step 2: Wait for Success

Look for:
```
✅ Build successful 🎉
✅ Deployed
🟢 Live
```

### Step 3: Verify Backend is Running

```bash
curl https://beautiful-gate-pos-api.onrender.com/api/test
```

Expected response:
```json
{"success": true, "message": "API is working"}
```

---

## Part 3: Deploy Frontend

### Step 1: Trigger Frontend Redeploy

```
1. Go to: https://dashboard.render.com
2. Click: beautiful-gate-client
3. Click: "Redeploy" (top right)
4. Wait: 2-3 minutes for 🟢 Live
```

### Step 2: Wait for Success

```
✅ Build successful 🎉
✅ Deployed
🟢 Live
```

### Step 3: Verify Frontend is Running

```
https://beautiful-gate-client.onrender.com
```

Should see login page (or registration page)

---

## Part 4: Database Migration in Supabase

### Step 1: Open Supabase Console

```
https://app.supabase.com
Login → Select project
```

### Step 2: Open SQL Editor

Left sidebar → "SQL Editor" → "New Query"

### Step 3: Copy and Run Migration SQL

Paste this entire script:

```sql
-- ============================================================================
-- STEP 1: Create Companies Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS companies (
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

CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);

-- ============================================================================
-- STEP 2: Add company_id to Users Table
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID;

ALTER TABLE users 
ADD CONSTRAINT fk_users_company_id 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- ============================================================================
-- STEP 3: Add company_id to Products Table
-- ============================================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS company_id UUID;

ALTER TABLE products 
ADD CONSTRAINT fk_products_company_id 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company_name ON products(company_id, name);

-- ============================================================================
-- STEP 4: Add company_id to Sales Table
-- ============================================================================

ALTER TABLE sales ADD COLUMN IF NOT EXISTS company_id UUID;

ALTER TABLE sales 
ADD CONSTRAINT fk_sales_company_id 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_sales_company_id ON sales(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_company_date ON sales(company_id, created_at);

-- ============================================================================
-- STEP 5: Create Default Company
-- ============================================================================

INSERT INTO companies (name, slug, email, phone, address, industry, subscription_tier)
VALUES (
  'Beautiful Gate',
  'beautiful-gate',
  'info@beautifulgate.com',
  '+233501234567',
  'Accra, Ghana',
  'Stationery & Printing',
  'FREE'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- STEP 6: Get the Company ID
-- ============================================================================

-- Run this query and COPY the ID result:
SELECT id FROM companies WHERE slug = 'beautiful-gate';
```

**Click RUN** ▶️

Wait for success, then copy the UUID result from the last query.

### Step 4: Backfill Existing Data

Create a new query with this SQL (replace `YOUR_COMPANY_UUID` with the ID from step 3):

```sql
UPDATE users SET company_id = 'YOUR_COMPANY_UUID' WHERE company_id IS NULL;
UPDATE products SET company_id = 'YOUR_COMPANY_UUID' WHERE company_id IS NULL;
UPDATE sales SET company_id = 'YOUR_COMPANY_UUID' WHERE company_id IS NULL;
UPDATE refresh_tokens SET company_id = 'YOUR_COMPANY_UUID' WHERE company_id IS NULL;
```

**Click RUN** ▶️

### Step 5: Verify Migration

Create a new query:

```sql
-- Verify tables exist
SELECT COUNT(*) as company_count FROM companies;
SELECT COUNT(*) as users_with_company FROM users WHERE company_id IS NOT NULL;
SELECT COUNT(*) as products_with_company FROM products WHERE company_id IS NOT NULL;

-- Verify default company
SELECT * FROM companies WHERE slug = 'beautiful-gate';
```

**Click RUN** ▶️

Expected results:
- company_count: 1
- users_with_company: (number of existing users)
- products_with_company: (number of existing products)
- One row showing Beautiful Gate company

---

## Part 5: Test Everything

### Test 1: Backend API

```bash
curl https://beautiful-gate-pos-api.onrender.com/api/test
```

Expected: ✅ Success response

### Test 2: Company Registration

Go to: https://beautiful-gate-client.onrender.com/register-company

Fill in:
- Company Name: `Test Company`
- Slug: `test-company`
- Admin Email: `admin@test.com`
- Admin Password: `SecurePass123`

Click: Register

Expected: ✅ Success message (not 500 error!)

### Test 3: Login

Go to: https://beautiful-gate-client.onrender.com

Login with:
- Email: `admin@test.com`
- Password: `SecurePass123`

Expected:
- ✅ Login succeeds
- ✅ Redirected to dashboard
- ✅ Company name in header = "Test Company" (not "Beautiful Gate")

### Test 4: Multi-Tenancy

Register another company:
- Company Name: `Another Company`
- Slug: `another-company`
- Admin Email: `admin2@test.com`
- Admin Password: `SecurePass123`

Login with admin2 credentials.

Expected:
- ✅ See "Another Company" in header
- ✅ See only data for this company
- ✅ No data from "Test Company" visible

---

## Troubleshooting

### Backend Won't Start

Check Render logs:
1. Dashboard → beautiful-gate-pos-api
2. Click "Logs" tab
3. Look for error message

Common issues:
- Missing environment variables → Set them in Render settings
- Database not connected → Check DATABASE_URL variable
- Port already in use → Shouldn't happen on Render

### Frontend Won't Load

Check browser console (F12):
- Network errors → Backend might not be live
- CORS errors → Check CORS config in backend
- Build errors → Check Render frontend build logs

### Company Registration Returns 500

Check if migration was completed:
1. Render → beautiful-gate-pos-api → Logs
2. Look for error message
3. Verify companies table exists in Supabase

### Login Fails

- Check if admin user was created during registration
- Check if company_id was set correctly in Supabase
- Try clearing localStorage: F12 → Application → Local Storage → Clear

---

## Checklist

### Deployment Checklist

- [ ] Backend redeployed (🟢 Live)
- [ ] Frontend redeployed (🟢 Live)
- [ ] Backend API test works
- [ ] Database migration SQL executed
- [ ] Existing data backfilled
- [ ] Migration verified with SELECT queries

### Testing Checklist

- [ ] Backend `/api/test` returns success
- [ ] Company registration succeeds (no 500 error)
- [ ] Login works with registered company
- [ ] Company branding appears (correct company name)
- [ ] Second company registration works
- [ ] Data isolation verified (Company A can't see Company B data)
- [ ] No console errors in browser

---

## Timeline

| Step | Time |
|------|------|
| Backend redeploy | 3 min |
| Frontend redeploy | 3 min |
| Database migration | 2 min |
| Backfill data | 1 min |
| Testing | 5 min |
| **Total** | **~15 min** |

---

## After Deployment

Once all tests pass:

✅ System is fully deployed and working  
✅ Multi-tenancy is functional  
✅ Ready for production testing  

Next steps:
1. Load test with multiple users
2. Test all features (products, sales, dashboard)
3. Security testing
4. Performance benchmarking

---

## Important URLs

| Service | URL |
|---------|-----|
| Backend API | https://beautiful-gate-pos-api.onrender.com |
| Frontend | https://beautiful-gate-client.onrender.com |
| Supabase | https://app.supabase.com |
| Render Dashboard | https://dashboard.render.com |

---

## Environment Variables Needed

### Backend (Render)

Set in Render → beautiful-gate-pos-api → Environment:

```
NODE_ENV=production
JWT_SECRET=[generate a random string, 32+ chars]
PAYSTACK_SECRET_KEY=[your paystack secret]
PAYSTACK_PUBLIC_KEY=[your paystack public]
SUPABASE_URL=https://yxakmdoiivaiyjcdaxny.supabase.co
SUPABASE_KEY=[your supabase anon key]
DATABASE_URL=[your supabase connection string]
```

### Frontend (Render)

Set in Render → beautiful-gate-client → Environment:

```
VITE_API_URL=https://beautiful-gate-pos-api.onrender.com
```

---

## Next Steps After Successful Deployment

1. **Phase 4 Testing**: Run comprehensive feature tests
2. **Performance Testing**: Load test with multiple concurrent users
3. **Security Testing**: Verify data isolation and auth
4. **Production Hardening**: Add monitoring, error tracking, backups
5. **Go Live**: Customer onboarding

---

**Ready?** Start with Part 1 (Redeploy Backend) now! 👉

