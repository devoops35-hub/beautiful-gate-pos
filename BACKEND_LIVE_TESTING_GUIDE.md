# 🟢 Backend is LIVE - Testing Guide

**Status**: ✅ Backend deployed and running  
**URL**: https://beautiful-gate-pos-api.onrender.com  
**Verified**: /api/test ✅ returns success

---

## Verification: API is Working

```bash
curl https://beautiful-gate-pos-api.onrender.com/api/test
```

**Response**:
```json
{
  "success": true,
  "message": "API is working",
  "timestamp": "2026-06-19T13:50:25.862Z"
}
```

✅ **Backend is responding correctly**

---

## Phase 4: Full Testing

Now let's test the complete multi-tenant system. Here's your testing plan:

### Test 1: Company Registration

**Go to**: https://beautiful-gate-client.onrender.com/register-company

**Fill in**:
- Company Name: `Test Company 1`
- Slug: `test-company-1`
- Admin Email: `admin1@test.com`
- Admin Password: `SecurePass123`
- Phone: `+233501234567` (optional)

**Expected Result**:
- ✅ See "Company registered successfully" message
- ✅ Can proceed to login
- ✅ No 500 errors

**What This Tests**:
- Database INSERT works
- Company creation works
- Admin user creation works
- Multi-tenant system initialized

---

### Test 2: Company Login

**Go to**: https://beautiful-gate-client.onrender.com (or return after registration)

**Fill in**:
- Email: `admin1@test.com`
- Password: `SecurePass123`

**Expected Result**:
- ✅ Login succeeds
- ✅ Redirected to dashboard
- ✅ Company name appears in header (not "Beautiful Gate")
- ✅ No "Beautiful Gate" branding

**What This Tests**:
- JWT token generation works
- Company info in token works
- Frontend context receives company data
- Branding customization works

---

### Test 3: Dashboard Access

**After login, you should see**:
- ✅ Company-specific dashboard
- ✅ Sales statistics
- ✅ Revenue charts
- ✅ No errors

**What This Tests**:
- Protected routes work
- Context-based data display works
- Charts and widgets render

---

### Test 4: Add a Product

**Go to**: Inventory page (if available)

**Action**: Add a new product
- Name: `Test Product`
- Price: `50.00`
- Quantity: `100`

**Expected Result**:
- ✅ Product added successfully
- ✅ Product appears in list
- ✅ Data persisted to database

**What This Tests**:
- CREATE operations work
- Company isolation (product linked to this company)
- Database persistence

---

### Test 5: Create a Sale

**Go to**: Sales/POS page

**Action**: 
1. Select the product you created
2. Set quantity: `2`
3. Complete checkout/payment

**Expected Result**:
- ✅ Sale created successfully
- ✅ Sale appears in history
- ✅ Product quantity decreases

**What This Tests**:
- Multi-table transactions work
- Company isolation (sale linked to this company)
- Payment flow works

---

### Test 6: Company Isolation

**Create a second company to verify isolation**:

**Step 1**: Logout from admin1
- Click logout/profile menu

**Step 2**: Go back to registration
- https://beautiful-gate-client.onrender.com/register-company

**Step 3**: Register Company 2
- Company Name: `Test Company 2`
- Slug: `test-company-2`
- Admin Email: `admin2@test2.com`
- Admin Password: `SecurePass123`

**Step 4**: Login to Company 2
- Use admin2 credentials
- Dashboard should show ONLY Company 2 data
- Products from Company 1 should NOT appear
- Sales from Company 1 should NOT appear

**Expected Result**:
- ✅ Company 2 sees only their own data
- ✅ Complete isolation between companies
- ✅ No cross-company data leakage

**What This Tests**:
- Multi-tenancy is working
- Data isolation is enforced
- Companies can't access each other's data

---

### Test 7: Company Branding

**In Company 2 dashboard**:

**Expected**:
- ✅ Company name = "Test Company 2"
- ✅ Different branding from Company 1
- ✅ Logo area ready for upload (if implemented)

**What This Tests**:
- Company-specific branding works
- Header displays correct company info
- Context values properly populated

---

## Quick Testing Checklist

Run through these in order:

- [ ] Backend is live: `/api/test` works ✅
- [ ] Company registration succeeds (Company 1)
- [ ] Can login with Company 1 admin account
- [ ] Dashboard displays without errors
- [ ] Company name appears in header
- [ ] Can add a product
- [ ] Can create a sale
- [ ] Register Company 2 successfully
- [ ] Login with Company 2 credentials
- [ ] Company 2 data is isolated (no Company 1 data visible)
- [ ] Company 2 branding is different

---

## What to Report Back

### If All Tests Pass ✅

```
Great! Everything working. Results:
✅ Backend live
✅ Company registration works
✅ Multi-tenancy verified
✅ Data isolation confirmed
Ready for production!
```

### If Any Test Fails ❌

```
Test [name] failed:
- Expected: [what should happen]
- Actual: [what happened]
- Error message: [if any]
- Steps to reproduce: [what you did]
```

---

## Common Issues & Quick Fixes

**Issue**: Login fails after registration
- **Fix**: Refresh page and try again
- Reason: Session/token might need refresh

**Issue**: "401 Unauthorized" errors
- **Fix**: Login again, token may have expired
- Reason: JWT tokens expire (15 min default)

**Issue**: Products don't appear after adding
- **Fix**: Refresh the page
- Reason: Frontend cache needs update

**Issue**: Company 2 sees Company 1 data
- **Fix**: Check if you're logged in correctly
- Reason: Could be cached login session

**Issue**: Frontend shows "Beautiful Gate" instead of company name
- **Fix**: Clear localStorage:
  - Open browser DevTools (F12)
  - Go to Application → Local Storage
  - Delete the site data
  - Refresh and login again

---

## Performance Notes

- First load: May take 2-3 seconds (Render cold start)
- Subsequent loads: Should be instant
- Database queries: ~200-500ms typically
- Frontend rendering: <1 second

---

## Success Criteria for Phase 4

All of these must be true:

1. ✅ Backend API is live and responding
2. ✅ Company registration works end-to-end
3. ✅ Multi-tenancy is functional
4. ✅ Data isolation is enforced
5. ✅ JWT authentication works
6. ✅ Dashboard and basic features work
7. ✅ No 500 errors or crashes
8. ✅ No console errors in frontend

---

## Next Steps After Testing

1. **If successful**: Move to Phase 4.5 (load testing)
2. **If issues found**: Debug and fix
3. **If all passed**: Sign off on production readiness

---

## Important URLs

| Service | URL |
|---------|-----|
| Backend API | https://beautiful-gate-pos-api.onrender.com |
| Frontend | https://beautiful-gate-client.onrender.com |
| API Test | https://beautiful-gate-pos-api.onrender.com/api/test |
| Register | https://beautiful-gate-client.onrender.com/register-company |
| Login | https://beautiful-gate-client.onrender.com |

---

## Need Help?

- Check browser console (F12) for errors
- Check Render backend logs for API errors
- Report specific error messages
- Describe steps to reproduce

---

**Status**: 🟢 Backend Live - Ready for comprehensive testing!

Now go test the complete flow! 🚀

