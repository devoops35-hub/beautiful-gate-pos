# Database Migration to Multi-Tenant - Step by Step

**Date**: June 10, 2026  
**Status**: Ready to Execute  
**Time Required**: 15-20 minutes  
**Risk Level**: Low (with proper backups)

---

## ⚠️ IMPORTANT: Backup First

Before running any migration, **back up your database**:

### Option 1: Supabase Automatic Backup
1. Go to Supabase dashboard: https://app.supabase.com
2. Select your project: `beautiful_gate_pos`
3. Navigate to: **Settings → Backups**
4. Click "Back up now"
5. Wait for confirmation
6. ✅ Backup created

### Option 2: Export Full Database
1. In Supabase, go to: **SQL Editor**
2. Click: **Backup** (top right)
3. Download the SQL file
4. Save safely

---

## 🔧 How to Run the Migration

### Step 1: Open Supabase SQL Editor

1. Go to: https://app.supabase.com
2. Click your project: `beautiful_gate_pos`
3. Left sidebar → **SQL Editor**
4. Click: **+ New Query**

---

### Step 2: Copy the Migration SQL

The migration script is here:  
📄 `server/scripts/migrate_to_multitenant.sql`

Copy the entire content (steps 1-8, but NOT steps 9-10 yet).

**Content to copy:**
```sql
-- Copy from CREATE TABLE IF NOT EXISTS companies...
-- ...through to the ON CONFLICT (slug) DO NOTHING; line
```

---

### Step 3: Run Initial Migration (Steps 1-8)

1. Paste the SQL into Supabase editor
2. Click: **Run** (or Ctrl+Enter)
3. Wait for completion
4. ✅ Should see: "Success" message

**What just happened:**
- ✅ Created `companies` table
- ✅ Added `company_id` to all tables
- ✅ Created indexes for performance
- ✅ Created default company "Beautiful Gate"

---

### Step 4: Get Your Company ID

Run this query to find the default company ID:

```sql
SELECT id FROM companies WHERE slug = 'beautiful-gate';
```

**You'll get output like:**
```
id
────────────────────────────────────────
550e8400-e29b-41d4-a716-446655440000
```

**Copy this ID** - you'll need it next.

---

### Step 5: Backfill Existing Data

Replace `YOUR_COMPANY_ID` with the ID from Step 4, then run:

```sql
UPDATE users SET company_id = 'YOUR_COMPANY_ID' WHERE company_id IS NULL;
UPDATE products SET company_id = 'YOUR_COMPANY_ID' WHERE company_id IS NULL;
UPDATE sales SET company_id = 'YOUR_COMPANY_ID' WHERE company_id IS NULL;
UPDATE sale_products SET company_id = 'YOUR_COMPANY_ID' WHERE company_id IS NULL;
UPDATE audit_logs SET company_id = 'YOUR_COMPANY_ID' WHERE company_id IS NULL;
UPDATE refresh_tokens SET company_id = 'YOUR_COMPANY_ID' WHERE company_id IS NULL;
```

**You should see:**
```
UPDATE 5        (if you have 5 users)
UPDATE 12       (if you have 12 products)
UPDATE 45       (if you have 45 sales)
...
```

---

### Step 6: Make company_id Required (NOT NULL)

After verifying the backfill worked, run:

```sql
ALTER TABLE users ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE products ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE sales ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE sale_products ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE audit_logs ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE refresh_tokens ALTER COLUMN company_id SET NOT NULL;
```

**This ensures:**
- ✅ Every user must belong to a company
- ✅ Every product must belong to a company
- ✅ Every sale must belong to a company
- ✅ Data integrity protected

---

## ✅ Verification Checklist

After migration, run these queries to verify everything worked:

### 1. Check Companies Table Created
```sql
SELECT * FROM companies;
```
Should show:
- 1 row: Beautiful Gate company
- id, name, slug, etc.

### 2. Check Users Have company_id
```sql
SELECT id, email, company_id FROM users LIMIT 5;
```
Should show:
- All users have company_id filled in
- Not NULL

### 3. Check Products Have company_id
```sql
SELECT id, name, company_id FROM products LIMIT 5;
```
Should show:
- All products have company_id filled in
- Not NULL

### 4. Check Sales Have company_id
```sql
SELECT id, total, company_id FROM sales LIMIT 5;
```
Should show:
- All sales have company_id filled in
- Not NULL

### 5. Check Indexes Created
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('companies', 'users', 'products', 'sales')
ORDER BY tablename;
```
Should show multiple indexes like:
- idx_companies_slug
- idx_users_company_id
- idx_products_company_id
- idx_sales_company_id
- etc.

---

## 🐛 If Something Goes Wrong

### Error: "Column company_id already exists"
This is fine! Means it was already added. Continue with next step.

### Error: "Constraint already exists"
This is fine! The constraint was already there. Continue.

### Error: "duplicate key value violates unique constraint"
This means multiple companies tried to use same slug. Solution:
```sql
-- Check what's there
SELECT * FROM companies WHERE slug = 'beautiful-gate';

-- If multiple, delete duplicates manually
DELETE FROM companies WHERE slug = 'beautiful-gate' AND id != 'KEEP_THIS_ID';
```

### Error: "NULL value in column company_id violates not-null constraint"
**Don't** make it NOT NULL yet. 
- Check if backfill worked: `SELECT COUNT(*) FROM users WHERE company_id IS NULL;`
- If count > 0, you didn't backfill yet. Go back to Step 5.

### Rollback if Critical Issue
```sql
-- Rollback by restoring from backup (in Supabase settings)
-- OR manually revert if needed:

ALTER TABLE users DROP COLUMN IF EXISTS company_id;
ALTER TABLE products DROP COLUMN IF EXISTS company_id;
ALTER TABLE sales DROP COLUMN IF EXISTS company_id;
DROP TABLE IF EXISTS companies;
```

---

## 📊 What Changed in Database

### Before Migration
```
users table:
├─ id
├─ email
├─ password
├─ name
└─ role

products table:
├─ id
├─ name
├─ price
└─ stock

sales table:
├─ id
├─ total
└─ created_at
```

### After Migration
```
companies table (NEW):
├─ id (PRIMARY KEY)
├─ name
├─ slug (UNIQUE)
├─ logo_url
├─ primary_color
└─ ... other fields

users table:
├─ id
├─ email
├─ password
├─ name
├─ role
└─ company_id (NEW - FOREIGN KEY → companies)

products table:
├─ id
├─ name
├─ price
├─ stock
└─ company_id (NEW - FOREIGN KEY → companies)

sales table:
├─ id
├─ total
├─ created_at
└─ company_id (NEW - FOREIGN KEY → companies)
```

---

## 🔐 Data Integrity Features Added

### Foreign Key Constraints
```
users.company_id → companies.id (ON DELETE CASCADE)
products.company_id → companies.id (ON DELETE CASCADE)
sales.company_id → companies.id (ON DELETE CASCADE)
```

**What this means:**
- ✅ Cannot insert user without valid company
- ✅ Cannot insert product without valid company
- ✅ Cannot insert sale without valid company
- ✅ If company deleted, all its data deleted (cascade)

### Indexes for Performance
```
companies (slug)           - Fast company lookup
users (company_id)         - Fast user filtering
products (company_id)      - Fast product filtering
sales (company_id)         - Fast sales filtering
sales (company_id, date)   - Fast sales by date
```

---

## 📋 Summary

### What You're Doing
Converting from **single-tenant** to **multi-tenant** database:
- One database serves multiple companies
- Each company's data is isolated
- Companies share infrastructure but not data

### Time Investment
- 15-20 minutes to run scripts
- No downtime
- Reversible with backup

### Next Steps After This
1. ✅ Database set up (you're doing this now)
2. ⬜ Backend API endpoints (next phase)
3. ⬜ Frontend changes (next phase)
4. ⬜ Testing & deployment (final phase)

---

## 🚀 Ready to Go?

**Before you start:**
- ✅ Backup taken?
- ✅ Read through instructions?
- ✅ Have Supabase open?

**Then follow these steps:**
1. Open SQL Editor in Supabase
2. Run Steps 1-8 migration SQL
3. Get company ID from Step 4 query
4. Run backfill queries from Step 5
5. Make columns NOT NULL from Step 6
6. Verify with checklist from Verification section
7. ✅ Done!

**Questions?** Check the troubleshooting section above.

---

**Status**: Ready for Execution  
**Next**: Proceed to Step 1 in Supabase

Let me know when you've completed the migration! ✅
