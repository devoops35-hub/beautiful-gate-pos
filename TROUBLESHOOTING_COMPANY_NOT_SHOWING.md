# Troubleshooting: Company Name Not Showing

## Problem
After logging in, the sidebar still shows "Beautiful Gate" instead of the registered company name.

## Root Cause
You're likely logged in with an **old user account** that was created BEFORE the multi-tenant company system was implemented. These old users don't have a `company_id` in the database, so the login endpoint doesn't return company data.

---

## Solution 1: Create and Login with New Company (Recommended)

This is the easiest and cleanest solution:

1. **Logout** from your current session
2. **Register a new company:**
   - Go to `/register-company`
   - Fill in company details (name, logo, color)
   - Create admin credentials
3. **Login** with the NEW admin account you just created
4. **Verify:** Sidebar should now show your company name and branding

---

## Solution 2: Link Existing User to a Company

If you want to keep using your existing user account (like "army@gmail.com"), you need to link it to a company in the database.

### Step 1: Find the Company ID

In Supabase SQL Editor, run:

```sql
SELECT id, name, slug 
FROM companies 
WHERE name = 'Beautiful Gate' 
   OR slug = 'beautiful-gate';
```

Copy the `id` (it's a UUID like `e64379c3-e7ad-4c16-9e43-8a7b7e3e57f2`)

### Step 2: Link Your User to the Company

Replace `YOUR_COMPANY_UUID_HERE` with the ID from Step 1:
Replace `army@gmail.com` with your actual email:

```sql
UPDATE users 
SET company_id = 'YOUR_COMPANY_UUID_HERE'
WHERE email = 'army@gmail.com' 
  AND company_id IS NULL;
```

### Step 3: Verify the Update

```sql
SELECT u.id, u.email, u.name, u.role, u.company_id, 
       c.name as company_name, c.slug, c.logo_url, c.primary_color
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE u.email = 'army@gmail.com';
```

You should see the company name, slug, logo, and color populated.

### Step 4: Logout and Login Again

1. **Logout** from the app (this clears the old cached data)
2. **Login** again with the same credentials
3. **Verify:** Company branding should now show correctly

---

## Solution 3: Link ALL Old Users to Default Company

If you have multiple old users and want to link them all to the default "Beautiful Gate" company:

```sql
-- First, get the Beautiful Gate company ID
SELECT id FROM companies WHERE slug = 'beautiful-gate' LIMIT 1;

-- Then link all users without a company
UPDATE users 
SET company_id = (SELECT id FROM companies WHERE slug = 'beautiful-gate' LIMIT 1)
WHERE company_id IS NULL;
```

---

## How to Check What's Wrong

### In Browser Console (F12)

1. Open browser dev tools (F12)
2. Go to **Console** tab
3. Type:
   ```javascript
   localStorage.getItem('company')
   localStorage.getItem('user')
   ```

**Expected:**
- `company` should be: `{"id":"...","name":"Your Company","slug":"...","logo_url":"...","primary_color":"#..."}`
- If it's `null` or shows "Beautiful Gate" and you registered a different company, you're using an old user account

### In Network Tab

1. Open **Network** tab
2. Login
3. Find the `/api/auth/login` request
4. Check the **Response**:
   ```json
   {
     "success": true,
     "user": {...},
     "company": {
       "id": "...",
       "name": "Your Company Name",
       "slug": "your-slug",
       "logo_url": "...",
       "primary_color": "#..."
     }
   }
   ```

**If `company` is `null` in the response:** Your user account doesn't have a `company_id` in the database. Use Solution 2 or Solution 3 above.

---

## Prevention for New Users

**All NEW users created through company registration will automatically have company data.** This issue only affects:
- Users created before multi-tenancy was implemented
- Users created directly via `/register` (not `/register-company`)

**Going forward:** Always use `/register-company` to create new companies, or ensure users are linked to a company when created.

---

## Test After Fixing

1. **Logout** completely
2. **Clear browser cache** (optional but recommended):
   - Chrome/Edge: Ctrl+Shift+Delete → Clear browsing data
   - Or just clear localStorage in console: `localStorage.clear()`
3. **Login** again
4. **Check sidebar:** Should show your company name, logo, and brand colors

---

## Still Not Working?

If after trying all solutions it's still not working:

1. **Check Render deployment:** Make sure the latest code is deployed
   - Go to Render dashboard
   - Check "Latest Deploy" timestamp
   - Should be after your last git push

2. **Hard refresh the page:** Ctrl+Shift+R (or Cmd+Shift+R on Mac)

3. **Check console logs:** Look for messages starting with:
   - "Login response:"
   - "Company data from login:"
   - "Sidebar - Company data:"

4. **Verify backend is returning company data:**
   ```bash
   curl -X POST https://beautiful-gate-pos-api.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your@email.com","password":"yourpassword"}'
   ```
   
   Look for the `company` object in the response.

---

**Most Common Fix:** Just logout, register a new company with new credentials, and login with the new account. Old accounts don't have company links.
