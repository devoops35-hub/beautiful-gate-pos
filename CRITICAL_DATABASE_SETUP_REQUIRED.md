# ⚠️ CRITICAL: Database Setup Required

**Issue**: Company registration returns 500 because the `companies` table doesn't exist  
**Fix**: Run the migration SQL in Supabase  
**Time**: ~5 minutes

---

## The Problem

When you try to register a company:
```
POST /api/companies/register → 500 Internal Server Error
```

This happens because:
1. Backend code is trying to INSERT into `companies` table
2. The `companies` table doesn't exist in database yet
3. Supabase throws an error (table not found)
4. 500 error is returned

---

## The Solution

The migration SQL has been created (`server/scripts/migrate_to_multitenant.sql`) but it needs to be **manually executed in Supabase**.

---

## Steps to Execute the Migration

### Step 1: Go to Supabase Console

```
https://app.supabase.com
```

Login if needed

### Step 2: Select Your Project

Look for: `yxakmdoiivaiyjcdaxny` (or find Beautiful Gate project)

### Step 3: Open SQL Editor

Left sidebar → "SQL Editor" or click the SQL icon

### Step 4: Create New Query

Click: "+ New Query"

### Step 5: Copy the Migration SQL

From this repository, find: `server/scripts/migrate_to_multitenant.sql`

**Copy the entire file content**

### Step 6: Paste into Supabase

Paste into the SQL editor query box

### Step 7: Execute

Click: "RUN" button (or Cmd/Ctrl + Enter)

**Wait for completion** (should take < 10 seconds)

---

## What the Migration Does

✅ Creates `companies` table with all columns  
✅ Adds `company_id` foreign key to `users` table  
✅ Adds `company_id` foreign key to `products` table  
✅ Adds `company_id` foreign key to `sales` table  
✅ Adds `company_id` foreign key to `sale_products` table  
✅ Adds `company_id` foreign key to `audit_logs` table  
✅ Adds `company_id` foreign key to `refresh_tokens` table  
✅ Creates indexes for performance  
✅ Creates default "Beautiful Gate" company  

---

## After Running Migration

### Step 1: Backfill Existing Data

The migration creates a default company. Now we need to link existing users/products/sales to it.

**In Supabase SQL Editor, run**:

```sql
-- Get the default company ID
SELECT id FROM companies WHERE slug = 'beautiful-gate';
```

This will return a UUID. **Copy this UUID**.

Then run (replace `YOUR_COMPANY_ID` with the UUID you copied):

```sql
UPDATE users SET company_id = 'YOUR_COMPANY_ID' WHERE company_id IS NULL;
UPDATE products SET company_id = 'YOUR_COMPANY_ID' WHERE company_id IS NULL;
UPDATE sales SET company_id = 'YOUR_COMPANY_ID' WHERE company_id IS NULL;
UPDATE refresh_tokens SET company_id = 'YOUR_COMPANY_ID' WHERE company_id IS NULL;
```

### Step 2: Verify the Migration

Run in SQL Editor:

```sql
-- Check companies table
SELECT COUNT(*) as company_count FROM companies;

-- Check if company_id was added to users
SELECT COUNT(*) as users_with_company FROM users WHERE company_id IS NOT NULL;

-- Check if default company exists
SELECT * FROM companies WHERE slug = 'beautiful-gate';
```

Expected results:
```
company_count: 1
users_with_company: [count of your existing users]
[One row with Beautiful Gate company]
```

---

## Quick Migration SQL

If you want to run everything in one go, use this:

```sql
-- STEP 1: Create Companies Table
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

-- STEP 2: Add company_id to Users
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS fk_users_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- STEP 3: Add company_id to Products
ALTER TABLE products ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE products ADD CONSTRAINT IF NOT EXISTS fk_products_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);

-- STEP 4: Add company_id to Sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE sales ADD CONSTRAINT IF NOT EXISTS fk_sales_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_sales_company_id ON sales(company_id);

-- STEP 5: Create Default Company
INSERT INTO companies (name, slug, email, phone, address, industry) 
VALUES ('Beautiful Gate', 'beautiful-gate', 'info@beautifulgate.com', '+233501234567', 'Accra, Ghana', 'Stationery & Printing')
ON CONFLICT (slug) DO NOTHING;

-- STEP 6: Backfill Existing Data
-- First get the ID:
-- SELECT id FROM companies WHERE slug = 'beautiful-gate';
-- Then use it in these queries:
-- UPDATE users SET company_id = '[company_id]' WHERE company_id IS NULL;
-- UPDATE products SET company_id = '[company_id]' WHERE company_id IS NULL;
-- UPDATE sales SET company_id = '[company_id]' WHERE company_id IS NULL;
```

---

## Timeline

| Step | Action | Time |
|------|--------|------|
| 1 | Go to Supabase console | 1 min |
| 2 | Open SQL editor | 30 sec |
| 3 | Copy migration SQL | 2 min |
| 4 | Execute migration | 10 sec |
| 5 | Get company ID | 30 sec |
| 6 | Backfill data | 10 sec |
| 7 | Verify | 1 min |
| **Total** | | **~5 min** |

---

## After Database Setup

Once the migration is complete:

1. ✅ `companies` table exists
2. ✅ All tables have `company_id` foreign keys
3. ✅ Default "Beautiful Gate" company created
4. ✅ Existing data linked to default company
5. ✅ Backend `/api/companies/register` will work

Then test again:
```
Go to: https://beautiful-gate-client.onrender.com/register-company
Try to register a new company
Should now work! ✅
```

---

## If You Get SQL Errors

**Error: "Relation does not exist"**
- The table might be named differently
- Run: `SELECT * FROM information_schema.tables` to see all tables

**Error: "Constraint already exists"**
- That's OK, the migration uses `IF NOT EXISTS` to handle this

**Error: "Permission denied"**
- Your Supabase role might not have permissions
- Switch to `postgres` role in Supabase

---

## Verify Everything Works

After migration, test with curl:

```bash
curl -X POST https://beautiful-gate-pos-api.onrender.com/api/companies/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Company",
    "slug": "test-company",
    "adminEmail": "admin@test.com",
    "adminPassword": "SecurePass123"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Company registered successfully",
  "data": { ... }
}
```

---

## Action Required NOW

1. ⏳ Go to Supabase console
2. ⏳ Open SQL editor
3. ⏳ Run the migration SQL
4. ⏳ Backfill existing data
5. ⏳ Test company registration again

---

**Status**: Database setup required before company registration will work.

**Next**: Execute migration in Supabase SQL editor! 👉

