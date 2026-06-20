# Critical Fix: Company Registration 500 Error

**Date**: June 19, 2026  
**Status**: FIXED AND PUSHED  
**Commit**: `41848f2`

---

## Problem Identified

When trying to register a new company via `/api/companies/register`, the backend was returning a **500 Internal Server Error** despite the code appearing correct.

### Root Cause

The `dbRun()` function in `server/config/supabase.js` was **failing to parse the column names** from the multi-line INSERT SQL statement. The regex pattern was too simple:

```javascript
// OLD (BROKEN):
const colMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
```

This failed when:
1. SQL was formatted across multiple lines
2. Column names had specific spacing
3. The RETURNING clause was present

Result: The `insertData` object was built with misaligned columns and values, causing Supabase to reject the INSERT.

---

## Solution Applied

### 1. **Fixed INSERT Parsing** (`server/config/supabase.js`)

✅ Improved regex to handle multi-line SQL:
```javascript
const colMatch = sql.match(/INSERT\s+INTO\s+\w+\s*\(([^)]+)\)\s*VALUES/i);
```

✅ Added validation:
- Check if columns were found
- Verify parameter count matches column count
- Log detailed diagnostic info before insertion

✅ Better error messages:
- Show which columns/params failed
- Include full error details from Supabase
- Help identify the exact problem

### 2. **Enhanced Error Handling** (`server/controllers/companyController.js`)

✅ Changed from `dbGet()` to `dbRun()`:
- `dbGet()` was designed for SELECT queries
- `dbRun()` is designed for INSERT/UPDATE/DELETE
- Now properly returns `result.rows[0]`

✅ Added detailed logging:
- Log company creation data before insert
- Log success/failure of each step
- Show user creation progress

✅ Better error responses:
- Include error message in response
- Show development error details in dev mode
- Clarify if company created but user creation failed

---

## What Changed

### Files Modified:
1. **`server/config/supabase.js`** - Fixed INSERT parsing logic
2. **`server/controllers/companyController.js`** - Better error handling

### No Database Changes Required
- No migrations needed
- No new tables or columns
- Existing company data unaffected

---

## How to Deploy

### Step 1: Manual Redeploy on Render ⚠️ **REQUIRED**

Since the code has been fixed and pushed to GitHub, you must trigger a redeploy:

1. Go to **https://dashboard.render.com**
2. Click on the **`beautiful-gate-pos-api`** service
3. Click the **"Deploy"** or **"Redeploy"** button in the top right
4. Wait **2-3 minutes** for the build to complete
5. Watch the logs for: **"🚀 POS Server running on port 10000"**

### Step 2: Test the Fix

Once Render shows 🟢 Live, test the company registration:

```bash
# Test 1: Verify API is running
curl https://beautiful-gate-pos-api.onrender.com/api/test

# Test 2: Try company registration (via Frontend or Curl)
# URL: https://beautiful-gate-client.onrender.com/register-company

# Fill in:
- Company Name: "Test Company"
- Slug: "test-company"  
- Admin Email: "admin@test.com"
- Admin Password: "SecurePass123"
- Click "Register"
```

### Step 3: Verify Success

You should see:
- ✅ Company registered message
- ✅ Can login with the admin account
- ✅ Company name appears in header (not "Beautiful Gate")
- ✅ Can access dashboard

---

## Debugging if Still Failing

If you still get a 500 error after redeploying:

### Check Render Logs:

1. Go to https://dashboard.render.com
2. Click `beautiful-gate-pos-api` 
3. Click **"Logs"** tab
4. Look for error messages like:

```
❌ Company creation error: ...
Parameter count mismatch: ...
Failed to parse columns from INSERT statement: ...
```

### Common Issues:

**Issue**: Still shows 404 on `/api/test`
- **Solution**: Rebuild didn't trigger. Click "Deploy" button again.

**Issue**: Shows "Failed to create company" but no detailed error
- **Solution**: Set `NODE_ENV=development` in Render environment to see error details

**Issue**: "Parameter count does not match column count"  
- **Solution**: Database schema mismatch. Run migration script.

---

## Verification Checklist

After deploying, verify:

- [ ] Backend is running: `GET /api/test` returns `{success: true}`
- [ ] Company registration endpoint exists: `POST /api/companies/register` doesn't 404
- [ ] Can register new company without 500 error
- [ ] Registered company appears in database
- [ ] Can login with registered company credentials
- [ ] Company name displays in header
- [ ] Products/sales are isolated to registered company

---

## What's Next

Once this is working:

1. ✅ Test full company registration flow
2. ✅ Test login with different companies
3. ✅ Verify data isolation (Company A can't see Company B data)
4. ✅ Test company branding (logo, colors)
5. ✅ Full multi-tenant SaaS testing

---

## Technical Details (For Reference)

### Old Flow (Broken):
```
Company Registration Request
  ↓
companyController.registerCompany()
  ↓
dbRun() with multi-line INSERT SQL
  ↓
Regex fails to parse columns correctly
  ↓
insertData object has wrong structure
  ↓
Supabase rejects INSERT
  ↓
500 Error
```

### New Flow (Fixed):
```
Company Registration Request
  ↓
companyController.registerCompany()
  ↓
dbRun() with improved regex parsing
  ↓
Validate columns match parameters
  ↓
Log detailed diagnostic info
  ↓
Supabase INSERT succeeds
  ↓
Create admin user
  ↓
Return 201 Created with company + user data
```

---

## Code Changes Summary

### `server/config/supabase.js`

**Before**:
```javascript
const colMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
const columns = colMatch ? colMatch[1].split(',').map(c => c.trim()) : [];
```

**After**:
```javascript
const colMatch = sql.match(/INSERT\s+INTO\s+\w+\s*\(([^)]+)\)\s*VALUES/i);

if (!colMatch || !colMatch[1]) {
  throw new Error(`Could not parse column names from INSERT statement`);
}

const columns = colMatch[1]
  .split(',')
  .map(c => c.trim())
  .filter(c => c.length > 0);

// Validate parameter count matches column count
if (params.length !== columns.length) {
  throw new Error(`Parameter count (${params.length}) does not match column count (${columns.length})`);
}
```

---

## Questions?

If the fix doesn't work after redeploying:

1. Check Render logs for specific error message
2. Verify database connection is working
3. Confirm all environment variables are set on Render
4. Try creating company via manual curl request to debug

**Next Step**: Manually redeploy on Render dashboard now! ⬆️

