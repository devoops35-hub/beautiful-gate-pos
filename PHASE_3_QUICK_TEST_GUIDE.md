# Phase 3 - Quick Testing Guide 🚀

**Status**: Phase 3 Frontend Implementation is COMPLETE and ready for testing  
**Build Status**: ✅ Zero errors - frontend builds successfully  
**Duration**: ~15 minutes for full manual test

---

## Quick Start

### Prerequisites
- [ ] Backend server running: `cd server && npm start`
- [ ] Database connected (Supabase already configured)
- [ ] Frontend dev server ready: `cd client && npm run dev`

---

## Test Flow 1: Register a New Company (5 min)

1. **Navigate to Company Registration**
   - Open browser: `http://localhost:5173/register-company`

2. **Fill Company Info (Step 1)**
   ```
   Company Name: Acme Corp
   Email: contact@acmecorp.com
   Phone: +233501234567
   Address: 123 Business Ave
   Industry: Retail
   Slug: (auto-generated) should be "acme-corp"
   ```

3. **Click "Next: Admin User"**

4. **Fill Admin Credentials (Step 2)**
   ```
   Admin Email: admin@acmecorp.com
   Password: TestPassword123
   Confirm Password: TestPassword123
   ```

5. **Click "Register"**
   - Should see success toast: "Company registered successfully!"
   - Browser redirects to `/login` automatically

6. **Verify in Database** (Supabase)
   ```sql
   SELECT id, name, slug FROM companies WHERE slug = 'acme-corp';
   SELECT id, email, company_id FROM users WHERE email = 'admin@acmecorp.com';
   ```

---

## Test Flow 2: Login & Check Company Branding (5 min)

1. **Login with Acme Corp Admin**
   - Email: `admin@acmecorp.com`
   - Password: `TestPassword123`
   - Click "Login"

2. **Verify Redirect**
   - Should redirect to Dashboard (`/`)
   - Should NOT show login page again

3. **Check Header Branding** ✨
   - Look at top of page
   - Should see: "Acme Corp" (not "Beautiful Gate")
   - Logo may show fallback image (that's OK - no custom logo uploaded yet)
   - Navigation buttons should be styled

4. **Check LocalStorage**
   - Open Browser DevTools (F12)
   - Go to Console tab
   - Run: `JSON.parse(localStorage.getItem('company'))`
   - Should show:
     ```javascript
     {
       id: "uuid...",
       name: "Acme Corp",
       slug: "acme-corp",
       primary_color: null,  // or hex color if set
       secondary_color: null
     }
     ```

5. **Test Navigation**
   - Click "Dashboard" in Header - Should work
   - Click "Sales" in Header - Should work
   - Click "Inventory" in Header - Should work
   - All pages should load (product list will be empty initially)

6. **Logout**
   - Click "Logout" button
   - Should redirect to login page
   - Check localStorage: `localStorage.getItem('company')` should be null
   - Check localStorage: `localStorage.getItem('token')` should be null

---

## Test Flow 3: Existing Beautiful Gate Users (3 min)

1. **Login as Beautiful Gate Admin**
   ```
   Email: admin@beautifulgate.com  (or any existing admin)
   Password: (their password)
   ```

2. **Verify Backward Compatibility**
   - Should login successfully (company_id backfilled)
   - Header should show "Beautiful Gate" (the default company)
   - All functionality should work as before
   - Dashboard shows existing products and sales

3. **Check localStorage**
   - Run: `JSON.parse(localStorage.getItem('company'))`
   - Should show Beautiful Gate company info
   - company_id should be: `12c66e96-e733-4060-91f8-e4aed0036190`

---

## Test Flow 4: Verify Multi-Tenancy (3 min)

1. **Create 2 Companies**
   - Company A: "Store Alpha" (admin: alpha@store.com)
   - Company B: "Store Beta" (admin: beta@store.com)

2. **Login as Company A Admin**
   - Add some products (via Inventory page)
   - Create a sale (via Sales page)
   - Logout

3. **Login as Company B Admin**
   - Check Products: should be EMPTY (not showing Company A's products)
   - Check Sales: should be EMPTY (not showing Company A's sales)
   - This verifies data isolation by company_id

4. **Logout & Login Back to Company A**
   - Check Products: should see the products you added
   - Check Sales: should see the sale you created
   - This confirms each company only sees their own data

---

## Build Verification ✅

The frontend has been built and verified:

```
✓ 119 modules transformed
✓ HTML: 0.56 kB (gzip: 0.35 kB)
✓ CSS: 23.45 kB (gzip: 4.73 kB)
✓ JS: 618.70 kB (gzip: 199.79 kB)
✓ NO ERRORS
```

Build command:
```bash
cd client && npm run build
```

---

## Common Issues & Fixes

### Issue: "Company not found" error
**Cause**: Backend tenantMiddleware can't find company in database  
**Fix**: Verify company was created in Supabase. Check:
```sql
SELECT * FROM companies WHERE slug = 'acme-corp';
```

### Issue: Header still shows "Beautiful Gate" after registration
**Cause**: Company data not saved to context  
**Fix**: 
- Check browser localStorage: `localStorage.getItem('company')`
- Refresh page (F5)
- If still showing, check that login response includes company object

### Issue: "Cannot add admin user" error
**Cause**: Email may already be in use  
**Fix**: Use unique email for each company registration

### Issue: API 401 Unauthorized on dashboard
**Cause**: JWT token expired or not in localStorage  
**Fix**: 
- Logout and login again
- Check: `localStorage.getItem('token')` exists
- Verify token not malformed

### Issue: Products/Sales not showing
**Cause**: Initial state - no data added yet, OR company isolation working  
**Fix**: 
- Add products via Inventory page
- Create a sale via Sales page
- Verify you're logged in as the right company

---

## Success Criteria Checklist

### Registration Works:
- [ ] Can navigate to `/register-company`
- [ ] Form validates input correctly
- [ ] Slug auto-generates from company name
- [ ] Can submit form and see success message
- [ ] Redirected to login page
- [ ] Company created in database
- [ ] Admin user created in database

### Login Works:
- [ ] Can login with newly registered company admin
- [ ] Redirected to dashboard
- [ ] Company data loaded to localStorage
- [ ] JWT token contains company info (if you decode it)

### Branding Works:
- [ ] Header shows company name (not "Beautiful Gate")
- [ ] Header shows company branding
- [ ] Navigation buttons styled with company colors
- [ ] All pages accessible and functional

### Multi-Tenancy Works:
- [ ] Different companies see different data
- [ ] Cannot access other company's products/sales
- [ ] Data properly isolated by company_id

### Backward Compatibility:
- [ ] Existing Beautiful Gate users can still login
- [ ] All existing functionality preserved
- [ ] No breaking changes to existing features

---

## When Testing is Complete

If all tests pass:

1. **Commit Status**: Already committed locally to git
   ```
   a25abaa (HEAD -> main) docs: Phase 3 Frontend Implementation - COMPLETE
   985cb7c fix: Add missing default export to LoginPage
   2816bc3 feat: Phase 3 - Frontend Implementation (Company Management UI & Branding)
   ```

2. **Next Step**: Push to GitHub
   ```bash
   git push origin main
   ```

3. **Then**: Auto-deploy to Render
   - GitHub webhook triggers auto-build
   - Docker images built and deployed
   - System live in staging/production

---

## Tips for Testing

- **Use Incognito Window**: For testing multiple users - avoids localStorage conflicts
- **Monitor Network Tab**: (DevTools → Network) to see API calls being made
- **Check Server Logs**: Terminal where backend is running, look for request logs
- **Database Queries**: Use Supabase console to verify data created/isolated
- **Test On Slow Network**: Use DevTools → Network throttling to test performance

---

## Files Modified in Phase 3

```
✅ client/src/App.jsx
✅ client/src/context/AuthContext.jsx
✅ client/src/config/api.js
✅ client/src/components/Header.jsx
✅ client/src/pages/LoginPage.jsx (export fix)
✅ client/src/pages/RegisterCompanyPage.jsx (new)
```

---

## Need Help?

If something isn't working:

1. **Check Frontend Console** (DevTools → Console)
   - Look for JavaScript errors
   - Check API request failures

2. **Check Backend Logs** (Terminal where `npm start` runs)
   - Look for database connection errors
   - Check request/response logs

3. **Check Supabase Database** (supabase.com)
   - Verify companies table has new entries
   - Verify users have company_id foreign keys
   - Check if data is properly isolated

4. **Verify Environment Variables** (server/.env)
   - DATABASE_URL should be set
   - JWT_SECRET should be set
   - CORS_ORIGINS should include http://localhost:5173

---

**Ready to test? Let's go! 🚀**

