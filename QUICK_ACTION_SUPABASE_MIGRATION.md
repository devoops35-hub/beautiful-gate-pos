# 🚀 Quick Action: Run Supabase Migration

**Status**: Backend is live but database needs setup  
**Time**: ~5 minutes  
**Action**: Run SQL migration in Supabase

---

## Why This Is Needed

Company registration returns 500 because the `companies` table doesn't exist yet.

The migration SQL exists but needs to be manually executed in Supabase.

---

## Steps (Copy-Paste Ready)

### 1. Open Supabase

```
https://app.supabase.com
Login → Select project
```

### 2. Open SQL Editor

Left sidebar → SQL Editor → New Query

### 3. Run This SQL

Copy-paste the entire thing:

```sql
-- Create Companies Table
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

-- Add company_id to Users
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE users ADD CONSTRAINT fk_users_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- Add company_id to Products  
ALTER TABLE products ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE products ADD CONSTRAINT fk_products_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);

-- Add company_id to Sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE sales ADD CONSTRAINT fk_sales_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_sales_company_id ON sales(company_id);

-- Create Default Company
INSERT INTO companies (name, slug, email, phone, address, industry) 
VALUES ('Beautiful Gate', 'beautiful-gate', 'info@beautifulgate.com', '+233501234567', 'Accra, Ghana', 'Stationery & Printing')
ON CONFLICT (slug) DO NOTHING;

-- Backfill Existing Data (replace with your company ID after running SELECT below)
-- First run: SELECT id FROM companies WHERE slug = 'beautiful-gate';
-- Then get the UUID and use in these:
-- UPDATE users SET company_id = 'UUID_HERE' WHERE company_id IS NULL;
-- UPDATE products SET company_id = 'UUID_HERE' WHERE company_id IS NULL;
-- UPDATE sales SET company_id = 'UUID_HERE' WHERE company_id IS NULL;
```

### 4. Click RUN

Wait for success message

### 5. Get Company ID

```sql
SELECT id FROM companies WHERE slug = 'beautiful-gate';
```

Copy the UUID result

### 6. Backfill Data

Replace `YOUR_UUID` with the UUID from step 5:

```sql
UPDATE users SET company_id = 'YOUR_UUID' WHERE company_id IS NULL;
UPDATE products SET company_id = 'YOUR_UUID' WHERE company_id IS NULL;
UPDATE sales SET company_id = 'YOUR_UUID' WHERE company_id IS NULL;
UPDATE refresh_tokens SET company_id = 'YOUR_UUID' WHERE company_id IS NULL;
```

Click RUN

### 7. Verify

```sql
SELECT COUNT(*) FROM companies;
SELECT COUNT(*) FROM users WHERE company_id IS NOT NULL;
```

Should show:
- 1 company
- X users with company_id

---

## After Migration

Company registration will work! ✅

Test:
```
https://beautiful-gate-client.onrender.com/register-company
Try registering a company
Should work now!
```

---

**Go to Supabase now and run the migration!** 👉

