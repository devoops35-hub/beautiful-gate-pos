# 🔐 Fix Supabase Permissions

Your database is created, but the anonymous role doesn't have permission to access tables.

---

## ✅ Fix in 2 Minutes

### Step 1: Open Supabase SQL Editor

1. Go to: https://app.supabase.com
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

---

### Step 2: Copy & Paste Permissions SQL

Open the file: `GRANT_PERMISSIONS.sql`

Copy ALL the SQL and paste into Supabase SQL Editor.

---

### Step 3: Run the Query

Click **Run** button

Wait for it to complete...

---

### Step 4: Test the App

Go back to: http://localhost:5173

Try to **Register** or **Login** - it should work now!

---

## 🔑 What This Does

Grants the anonymous Supabase role permission to:
- ✅ SELECT (read)
- ✅ INSERT (create)
- ✅ UPDATE (edit)
- ✅ DELETE (remove)

On all tables:
- users
- products
- sales
- sale_products
- settings
- refresh_tokens
- audit_logs

---

## Quick Copy-Paste

If you can't find the file, paste this:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.refresh_tokens TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_logs TO anon;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
```

---

## ✅ After Permissions Are Set

1. No restart needed
2. Frontend will immediately work
3. You can register users
4. You can login
5. You can use the POS system

---

## 🚀 Then You're Done!

Your POS system will be **fully functional**! 🎉

Go to: http://localhost:5173

**Register → Login → Use the system!**
