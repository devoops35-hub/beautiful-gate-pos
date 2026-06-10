# Step-by-Step: Fix Currency from NGN to GHS

**Status**: Database still has NGN, needs immediate update

---

## The Problem

The settings table in your Supabase database has:
```
key: 'currency'
value: 'NGN'  ❌
```

Should be:
```
key: 'currency'
value: 'GHS'  ✅
```

---

## Step 1: Access Supabase

1. Go to https://app.supabase.com
2. Login with your account
3. Select your project
4. Click **"SQL Editor"** on the left sidebar

---

## Step 2: Create New Query

1. Click **"New Query"** button
2. Paste this exact SQL:

```sql
SELECT id, key, value FROM public.settings WHERE key = 'currency';
```

3. Click **"Run"** button
4. You should see:
   ```
   id | key      | value
   3  | currency | NGN
   ```

**This confirms NGN is in the database.**

---

## Step 3: Update Currency to GHS

1. Click **"New Query"** again
2. Paste this SQL:

```sql
UPDATE public.settings 
SET value = 'GHS'
WHERE key = 'currency';
```

3. Click **"Run"** button
4. You should see: `Query executed` ✅

---

## Step 4: Verify Update

1. Click **"New Query"** again
2. Paste this SQL:

```sql
SELECT id, key, value FROM public.settings WHERE key = 'currency';
```

3. Click **"Run"** button
4. You should now see:
   ```
   id | key      | value
   3  | currency | GHS
   ```

**If it shows GHS, the update was successful!** ✅

---

## Step 5: Restart Server

After confirming the database shows GHS:

```bash
# Stop server (if running)
Ctrl+C

# Start server again
npm start
```

Server will now load the correct currency (GHS) from database.

---

## Step 6: Verify in Application

1. Go to http://localhost:5173
2. Login
3. Go to dashboard or any page showing currency
4. Should display ₵ (Ghana Cedi symbol)
5. **NOT** ₦ (Naira symbol)

---

## If It Still Shows NGN

### Problem 1: Query didn't execute
- Make sure you clicked the **"Run"** button
- Check for any red error message
- If error, read the message carefully

### Problem 2: Wrong table/database
- Verify you're in the correct Supabase project
- Check that settings table exists
- Run: `SELECT * FROM public.settings;` to see all settings

### Problem 3: Multiple currency rows (unlikely)
- Run: `SELECT * FROM settings WHERE key = 'currency';`
- If you see multiple rows, update all of them:
  ```sql
  UPDATE public.settings 
  SET value = 'GHS'
  WHERE key = 'currency' AND value != 'GHS';
  ```

---

## Quick Reference: The SQL Commands

### See current currency
```sql
SELECT id, key, value FROM public.settings WHERE key = 'currency';
```

### Update to GHS
```sql
UPDATE public.settings SET value = 'GHS' WHERE key = 'currency';
```

### See all settings
```sql
SELECT * FROM public.settings;
```

---

## Expected Results Timeline

1. **Before Update**: value = 'NGN' ❌
2. **After Update**: value = 'GHS' ✅
3. **After Server Restart**: Dashboard shows ₵ symbol
4. **After Hard Refresh**: Browser shows ₵ symbol (Ctrl+Shift+R)

---

## Troubleshooting

### Query says "relation settings does not exist"
- Check spelling: should be `public.settings` (with schema prefix)
- Verify settings table exists
- Run: `\dt public.settings` to list tables

### Query says "permission denied"
- Make sure you're logged into Supabase
- Check you have editor access to the database
- Try in incognito/private browser window

### Update says "0 rows affected"
- Settings table exists but currency key not found
- Check exact key name: `SELECT DISTINCT key FROM settings;`
- Key might be 'Currency' (capital C) instead of 'currency'

---

## Confirmation Checklist

After completing all steps, verify:

- [ ] Ran SELECT query, saw: `currency | NGN`
- [ ] Ran UPDATE query, got: `Query executed`
- [ ] Ran SELECT query again, now sees: `currency | GHS`
- [ ] Restarted server with `npm start`
- [ ] Checked database shows GHS (not NGN)
- [ ] Opened browser to http://localhost:5173
- [ ] Currency displays as ₵ (Cedi) not ₦ (Naira)

**All checked ✅**: Currency is fixed!

---

## Commands Summary

```bash
# In Supabase SQL Editor:

# 1. Check current value
SELECT id, key, value FROM public.settings WHERE key = 'currency';

# 2. Update to GHS
UPDATE public.settings SET value = 'GHS' WHERE key = 'currency';

# 3. Verify update
SELECT id, key, value FROM public.settings WHERE key = 'currency';

# In Terminal:
# 4. Restart server
npm start

# 5. Hard refresh browser
# Ctrl+Shift+R in browser
```

---

## Still Not Working?

If after all this the currency still shows NGN:

1. **Check if it's cached**:
   - Hard refresh: Ctrl+Shift+R
   - Clear browser cache: Ctrl+Shift+Delete
   - Close browser completely and reopen

2. **Check API response**:
   - Open DevTools: F12
   - Go to Network tab
   - Refresh page
   - Look for request to `/api/settings` or `/api/settings/currency`
   - Check the response - it should show `GHS`

3. **Check database directly**:
   - In Supabase, click "settings" table
   - Look at the data grid
   - Find row with key = 'currency'
   - Verify value = 'GHS' (not 'NGN')

4. **Restart everything**:
   ```bash
   # Stop server
   Ctrl+C
   
   # Hard restart
   npm start
   
   # In browser, hard refresh
   Ctrl+Shift+R
   ```

---

**Next Action**: Follow Steps 1-6 above to fix the currency!
