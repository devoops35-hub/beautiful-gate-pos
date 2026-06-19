# Database Migration - Quick Reference Card

**Print this or keep it open while migrating!**

---

## 🎯 What You're Doing

Converting database from **single-tenant** to **multi-tenant**:
- Add `companies` table
- Add `company_id` to all tables
- Link existing data to default company

**Time**: 15-20 minutes  
**Risk**: Low (backed up)  
**Reversible**: Yes

---

## 📋 The 6 Steps

### Step 1: Backup
- Supabase → Settings → Backups → "Back up now"
- ✅ Wait for success

### Step 2: Open SQL Editor
- Supabase → SQL Editor → New Query

### Step 3: Run Migration Script
- Copy: `server/scripts/migrate_to_multitenant.sql` (Steps 1-8)
- Paste in SQL editor
- Click: Run
- ✅ Wait for "Success"

### Step 4: Get Company ID
Run this:
```sql
SELECT id FROM companies WHERE slug = 'beautiful-gate';
```
**Copy the ID** (looks like: `550e8400-e29b-41d4-a716-...`)

### Step 5: Backfill Data
Replace `YOUR_COMPANY_ID` with ID from Step 4:
```sql
UPDATE users SET company_id = 'YOUR_COMPANY_ID' WHERE company_id IS NULL;
UPDATE products SET company_id = 'YOUR_COMPANY_ID' WHERE company_id IS NULL;
UPDATE sales SET company_id = 'YOUR_COMPANY_ID' WHERE company_id IS NULL;
UPDATE sale_products SET company_id = 'YOUR_COMPANY_ID' WHERE company_id IS NULL;
UPDATE audit_logs SET company_id = 'YOUR_COMPANY_ID' WHERE company_id IS NULL;
UPDATE refresh_tokens SET company_id = 'YOUR_COMPANY_ID' WHERE company_id IS NULL;
```
✅ Should see: `UPDATE 5`, `UPDATE 12`, etc.

### Step 6: Make NOT NULL
```sql
ALTER TABLE users ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE products ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE sales ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE sale_products ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE audit_logs ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE refresh_tokens ALTER COLUMN company_id SET NOT NULL;
```
✅ Should see no errors

---

## ✅ Verify It Worked

**Quick Check:**
```sql
-- Should return 1 company
SELECT COUNT(*) FROM companies;

-- Should return user count (no NULLs)
SELECT COUNT(*) FROM users WHERE company_id IS NOT NULL;

-- Should return product count (no NULLs)
SELECT COUNT(*) FROM products WHERE company_id IS NOT NULL;
```

---

## 🔗 Files You'll Need

1. **Migration Script**: `server/scripts/migrate_to_multitenant.sql`
2. **Instructions**: `DATABASE_MIGRATION_INSTRUCTIONS.md`
3. **Visual Guide**: `MIGRATION_VISUAL_GUIDE.md`
4. **Troubleshooting**: See section in instructions

---

## 🚨 If Something Goes Wrong

### "Column already exists"
→ OK! It was already added. Continue.

### "Constraint already exists"  
→ OK! Continue.

### "Too many rows to update"
→ Wait a bit, try again.

### Critical Error?
→ Restore backup from Supabase settings

---

## ✨ What Changes

### Before
```
companies table: DOES NOT EXIST
users table: Has email, password (NOT company_id)
products table: Has name, price (NOT company_id)
sales table: Has total, date (NOT company_id)
```

### After
```
companies table: ✅ NEW (stores company info)
users table: Has email, password, company_id ✅
products table: Has name, price, company_id ✅
sales table: Has total, date, company_id ✅
```

---

## 🎯 Next After This

After migration completes:
1. Backend API endpoints (Phase 2)
2. Frontend changes (Phase 3)
3. Testing (Phase 4)
4. Deploy (Phase 5)

---

## 📞 Troubleshooting Checklist

- [ ] Backup completed before starting
- [ ] SQL Editor open in Supabase
- [ ] Steps 1-8 migration ran successfully
- [ ] Got company ID from query
- [ ] Backfill queries completed
- [ ] No NULL values in company_id columns
- [ ] NOT NULL constraints applied
- [ ] Verification queries passed

---

## 🟢 Ready to Start?

1. ✅ Backup taken?
2. ✅ Read instructions?
3. ✅ Have this card handy?

→ Go to Supabase and run Step 1 (backup)
→ Then proceed with Steps 2-6

**Good luck!** 🚀
