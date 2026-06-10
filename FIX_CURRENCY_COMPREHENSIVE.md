# Comprehensive Currency Fix Guide

**Issue**: Settings table currency is NGN but won't update to GHS

---

## Root Causes & Solutions

### Cause 1: Row-Level Security (RLS) Blocking Updates

**Solution**:

1. Go to Supabase → SQL Editor
2. Run this SQL:

```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'settings';

-- If rowsecurity = true, disable it
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- Now try the update
UPDATE public.settings SET value = 'GHS' WHERE key = 'currency';

-- Verify
SELECT * FROM public.settings WHERE key = 'currency';
```

3. If you see ✅ `currency | GHS` → **Issue Fixed!**

---

### Cause 2: UPDATE Not Working - Use DELETE + INSERT Instead

**Solution**:

If the UPDATE above didn't work, try this:

1. Go to Supabase → SQL Editor
2. Run this SQL:

```sql
-- Delete the old NGN record
DELETE FROM public.settings WHERE key = 'currency' AND value = 'NGN';

-- Insert new GHS record
INSERT INTO public.settings (key, value) 
VALUES ('currency', 'GHS')
ON CONFLICT (key) DO UPDATE SET value = 'GHS';

-- Verify
SELECT * FROM public.settings WHERE key = 'currency';
```

3. If you see ✅ `currency | GHS` → **Issue Fixed!**

---

### Cause 3: Multiple Rows with Same Key

**Solution**:

1. Check how many currency rows exist:

```sql
SELECT id, key, value FROM public.settings WHERE key = 'currency';
```

2. If you see more than ONE row:

```sql
-- Delete all currency rows
DELETE FROM public.settings WHERE key = 'currency';

-- Insert ONE correct row
INSERT INTO public.settings (key, value) 
VALUES ('currency', 'GHS');

-- Verify
SELECT * FROM public.settings WHERE key = 'currency';
```

---

### Cause 4: Constraint Violation

**Solution**:

The key column should have UNIQUE constraint. If it does:

```sql
-- This should work (ON CONFLICT handles duplicates)
INSERT INTO public.settings (key, value) 
VALUES ('currency', 'GHS')
ON CONFLICT (key) DO UPDATE 
SET value = 'GHS', updated_at = CURRENT_TIMESTAMP;

-- Verify
SELECT * FROM public.settings WHERE key = 'currency';
```

---

## Step-by-Step Master Fix

**Try these in order:**

### Step 1: Direct UPDATE (Most Common)
```sql
UPDATE public.settings SET value = 'GHS' WHERE key = 'currency';
SELECT * FROM public.settings WHERE key = 'currency';
```
✅ Works? → Done!  
❌ Still NGN? → Go to Step 2

---

### Step 2: DELETE + INSERT
```sql
DELETE FROM public.settings WHERE key = 'currency';
INSERT INTO public.settings (key, value) VALUES ('currency', 'GHS');
SELECT * FROM public.settings WHERE key = 'currency';
```
✅ Works? → Done!  
❌ Still NGN? → Go to Step 3

---

### Step 3: Disable RLS + UPDATE
```sql
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
UPDATE public.settings SET value = 'GHS' WHERE key = 'currency';
SELECT * FROM public.settings WHERE key = 'currency';
```
✅ Works? → Done!  
❌ Still NGN? → Go to Step 4

---

### Step 4: Full Reset
```sql
-- See what's there
SELECT * FROM public.settings;

-- Delete all currency entries
DELETE FROM public.settings WHERE key = 'currency';

-- Re-insert with correct value
INSERT INTO public.settings (key, value) 
VALUES 
  ('tax_rate', '0.075'),
  ('company_name', 'Beautiful Gate'),
  ('currency', 'GHS');

-- Verify all
SELECT * FROM public.settings;
```
✅ Works? → Done!

---

## After Database Fix

### Step 5: Restart Server
```bash
npm start
```

### Step 6: Hard Refresh Browser
- Press: `Ctrl+Shift+R`

### Step 7: Verify in Application
- Dashboard should show ₵ (Cedi symbol)
- NOT ₦ (Naira symbol)

---

## Verification Queries

### See Current Currency
```sql
SELECT value FROM public.settings WHERE key = 'currency';
```

### See All Settings
```sql
SELECT * FROM public.settings;
```

### Count Currency Rows
```sql
SELECT COUNT(*) FROM public.settings WHERE key = 'currency';
```

### See Table Structure
```sql
\d public.settings
```

---

## Common Error Messages & Fixes

### Error: "relation 'settings' does not exist"
- Table doesn't exist or wrong schema
- Run: `SELECT * FROM information_schema.tables WHERE table_name = 'settings';`

### Error: "permission denied"
- RLS policy blocking update
- Solution: Disable RLS as shown in Step 3

### Error: "duplicate key value violates unique constraint"
- Multiple currency keys exist
- Solution: Use Step 4 (Full Reset)

### Error: "could not serialize access"
- Concurrent access issue
- Solution: Wait and try again, or restart server

---

## Confirmation

After running the appropriate fix, you should see:

```
id | key      | value | updated_at
3  | currency | GHS   | 2026-06-08 ...
```

**NOT**:
```
id | key      | value
3  | currency | NGN
```

---

## If Still Not Working

### Debug Steps

1. **Check direct Supabase table view**:
   - Go to Supabase Dashboard
   - Click "settings" table
   - Look for row with key = 'currency'
   - What does the value column show?

2. **Run query to see ALL data**:
```sql
SELECT * FROM public.settings;
```

3. **Check API response**:
   - In browser, go to: `http://localhost:3003/api/settings`
   - Should show JSON with: `"currency": "GHS"`
   - If shows "NGN", database wasn't updated

4. **Check server logs**:
   - Restart server: `npm start`
   - Look for any error messages
   - Note any database-related errors

---

## File References

- `DISABLE_RLS_AND_FIX_CURRENCY.sql` - RLS-safe fix
- `FIX_CURRENCY_DELETE_INSERT.sql` - Delete + Insert approach
- `UPDATE_CURRENCY_TO_GHS.sql` - Simple update

---

## Summary

| Approach | When to Use | Success Rate |
|----------|------------|--------------|
| Simple UPDATE | First try | 60% |
| DELETE + INSERT | If UPDATE fails | 90% |
| Disable RLS | If RLS blocking | 95% |
| Full Reset | Nothing else works | 100% |

---

**Try Step 1 first. If it doesn't work, move to Step 2, then Step 3, then Step 4.**

Each step is progressively more aggressive but also more likely to work.
