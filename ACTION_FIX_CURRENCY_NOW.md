# ACTION: Fix Currency Now

**Problem**: Settings table shows `currency = 'NGN'` instead of `'GHS'`

---

## Quick Action (Try These in Order)

### Option 1: Simple Update (Try First)

Go to Supabase → SQL Editor → Copy-Paste:

```sql
UPDATE public.settings SET value = 'GHS' WHERE key = 'currency';
SELECT * FROM public.settings WHERE key = 'currency';
```

Click **Run** ▶️

✅ If you see `currency | GHS` → **DONE!**

❌ If still shows `NGN` → Go to Option 2

---

### Option 2: Delete and Re-Insert

Go to Supabase → SQL Editor → Copy-Paste:

```sql
DELETE FROM public.settings WHERE key = 'currency';
INSERT INTO public.settings (key, value) VALUES ('currency', 'GHS');
SELECT * FROM public.settings WHERE key = 'currency';
```

Click **Run** ▶️

✅ If you see `currency | GHS` → **DONE!**

❌ If still NGN → Go to Option 3

---

### Option 3: Disable RLS Protection

Go to Supabase → SQL Editor → Copy-Paste:

```sql
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
UPDATE public.settings SET value = 'GHS' WHERE key = 'currency';
SELECT * FROM public.settings WHERE key = 'currency';
```

Click **Run** ▶️

✅ If you see `currency | GHS` → **DONE!**

---

## After You See `currency | GHS`

1. **Restart Server**:
   ```bash
   npm start
   ```

2. **Hard Refresh Browser**:
   - Press: `Ctrl+Shift+R`

3. **Check Dashboard**:
   - Should show ₵ (Cedi)
   - NOT ₦ (Naira)

---

## Support Files

- `FIX_CURRENCY_COMPREHENSIVE.md` - Full troubleshooting guide
- `FIX_CURRENCY_DELETE_INSERT.sql` - Option 2 SQL
- `DISABLE_RLS_AND_FIX_CURRENCY.sql` - Option 3 SQL

---

**Do one option now and report back with result!**
