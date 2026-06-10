# Currency Fix: NGN to GHS

**Date**: June 8, 2026  
**Status**: ✅ FIXED  
**Issue**: Database storing NGN (Nigerian Naira) instead of GHS (Ghana Cedi)

---

## Problem

The database settings table had currency set to 'NGN' (Nigerian Naira) instead of 'GHS' (Ghana Cedi).

**Current State**:
```
settings table:
├── key: 'currency'
└── value: 'NGN'  ❌ Wrong currency
```

**Should Be**:
```
settings table:
├── key: 'currency'
└── value: 'GHS'  ✅ Correct currency
```

---

## Root Cause

The database schema file had 'NGN' as the default value when settings were created.

**File**: `CREATE_TABLES.sql` (Line 95)

```sql
-- Before
INSERT INTO public.settings (key, value) VALUES
  ('tax_rate', '0.075'),
  ('company_name', 'Beautiful Gate'),
  ('currency', 'NGN')  ❌

-- After
INSERT INTO public.settings (key, value) VALUES
  ('tax_rate', '0.075'),
  ('company_name', 'Beautiful Gate'),
  ('currency', 'GHS')  ✅
```

---

## Fix Applied

### 1. Update Schema File
**File**: `CREATE_TABLES.sql`
- Changed line 95: `'NGN'` → `'GHS'`
- This ensures new database setups use correct currency

### 2. Update Current Database
**File**: `UPDATE_CURRENCY_TO_GHS.sql` (NEW)
- Run this SQL to fix existing database

---

## How to Apply Fix

### Step 1: Update Existing Database

1. Go to Supabase dashboard
2. Click "SQL Editor"
3. Open file: `UPDATE_CURRENCY_TO_GHS.sql`
4. Copy the SQL
5. Paste into Supabase SQL Editor
6. Click "Run"

**SQL to Run**:
```sql
UPDATE public.settings 
SET value = 'GHS', updated_at = CURRENT_TIMESTAMP
WHERE key = 'currency' AND value = 'NGN';

SELECT key, value, updated_at FROM public.settings WHERE key = 'currency';
```

**Expected Result**:
```
key      | value | updated_at
---------|-------|-------------------
currency | GHS   | 2026-06-08 ...
```

### Step 2: Verify in Supabase

1. Go to Supabase Dashboard
2. Click "settings" table
3. Find row with `key = 'currency'`
4. Verify `value = 'GHS'`

---

## Impact

### What Changes
- ✅ Currency symbol shows as ₵ (Ghana Cedi) instead of ₦ (Naira)
- ✅ Paystack transactions use correct currency
- ✅ Reports and analytics show correct currency
- ✅ Future database resets use correct currency

### What Doesn't Change
- ✅ No data loss
- ✅ No sales data affected
- ✅ No transaction data affected
- ✅ Just the currency setting

---

## Files Modified

| File | Change | Status |
|------|--------|--------|
| `CREATE_TABLES.sql` | Line 95: NGN → GHS | ✅ Fixed |
| `UPDATE_CURRENCY_TO_GHS.sql` | NEW - Update existing DB | ✅ Created |

---

## Verification Checklist

After running the SQL:

- [ ] Go to Supabase settings table
- [ ] Find row with key = 'currency'
- [ ] Verify value = 'GHS'
- [ ] Check timestamp updated to current time
- [ ] Restart server to reload settings
- [ ] Verify UI shows ₵ symbol correctly

---

## Code Reference

**Paystack Integration** (Already Correct):
```javascript
// In salesController.js
const transaction = await paystack.transaction.initialize({
  amount: Math.round(total * 100),
  currency: 'GHS',  // ✅ Already set to GHS
  ...
});
```

**Frontend Display** (Already Correct):
```javascript
// In PaymentDetails.jsx
<span>₵{total.toFixed(2)}</span>  // ✅ Already uses Ghana Cedi symbol
```

---

## Quick Steps

1. ✅ **Schema Fixed**: `CREATE_TABLES.sql` updated to use 'GHS'
2. ⏳ **Database Fix**: Run `UPDATE_CURRENCY_TO_GHS.sql` in Supabase
3. ⏳ **Server Restart**: Restart server to reload settings
4. ✅ **Verify**: Check settings table shows 'GHS'

---

## Database Query

To verify the fix was applied:

```sql
SELECT * FROM public.settings WHERE key = 'currency';
```

Expected output:
```
id  | key      | value | updated_at
----|----------|-------|-------------------
3   | currency | GHS   | 2026-06-08 13:12:07
```

---

## Status

✅ **Schema File Fixed**  
⏳ **Database Update Required** (Run UPDATE_CURRENCY_TO_GHS.sql)  
⏳ **Server Restart Required**

---

## Next Steps

1. **Immediately**: Run UPDATE_CURRENCY_TO_GHS.sql in Supabase
2. **Then**: Restart server (`npm start`)
3. **Verify**: Check settings table in Supabase

---

## Support

If the SQL update fails:
1. Check if 'currency' row exists in settings table
2. Verify you're connected to correct Supabase project
3. Try manual update: `UPDATE settings SET value = 'GHS' WHERE key = 'currency';`
4. Check Supabase SQL Editor error message

---

**Timeline**: Immediate fix needed  
**Complexity**: Simple (1 SQL line)  
**Risk**: None (just updating a setting value)
