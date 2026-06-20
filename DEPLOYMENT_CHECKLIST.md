# Deployment Checklist

**Session**: Fresh Deployment from Scratch  
**Date**: June 19, 2026  
**Total Estimated Time**: 25 minutes

---

## Pre-Deployment

- [ ] Read `START_FRESH_DEPLOYMENT_NOW.md` (2 min)
- [ ] Read `COMPLETE_FRESH_DEPLOYMENT_GUIDE.md` (5 min)
- [ ] Have Render dashboard open: https://dashboard.render.com
- [ ] Have Supabase console ready: https://app.supabase.com
- [ ] Have backend repo URL ready: https://github.com/devoops35-hub/beautiful-gate-pos

**Time**: ~7 minutes

---

## Phase 1: Backend Deployment

### Pre-Deployment Checks
- [ ] Backend service exists in Render (or create new)
- [ ] Service is connected to GitHub repo
- [ ] Build command is correct: `npm install`
- [ ] Start command is correct: `npm start`

### Deployment
- [ ] Go to: https://dashboard.render.com
- [ ] Click: beautiful-gate-pos-api service
- [ ] Click: "Redeploy" button (top right)
- [ ] Wait: Build starts (shows "Building...")
- [ ] Wait: Build completes (shows "✅ Build successful")
- [ ] Wait: Deployment shows 🟢 Live (green status)

### Verification
- [ ] Status shows: 🟢 Live
- [ ] Logs show: "POS Server running on port 10000"
- [ ] Test API: `curl https://beautiful-gate-pos-api.onrender.com/api/test`
- [ ] Response includes: `{"success":true,"message":"API is working"}`

**Time**: 3-5 minutes

---

## Phase 2: Frontend Deployment

### Pre-Deployment Checks
- [ ] Frontend service exists in Render (or create new)
- [ ] Service is connected to GitHub repo
- [ ] Build command is correct: `npm install && npm run build`
- [ ] Start command is correct: `npm start` or `npx vite preview --host 0.0.0.0`

### Deployment
- [ ] Go to: https://dashboard.render.com
- [ ] Click: beautiful-gate-client service
- [ ] Click: "Redeploy" button (top right)
- [ ] Wait: Build starts
- [ ] Wait: Build completes (shows "✅ Build successful")
- [ ] Wait: Deployment shows 🟢 Live

### Verification
- [ ] Status shows: 🟢 Live
- [ ] Logs show: Build completed successfully
- [ ] Load frontend: https://beautiful-gate-client.onrender.com
- [ ] Page loads: Should see registration or login page

**Time**: 3-5 minutes

---

## Phase 3: Database Migration

### Pre-Deployment Checks
- [ ] Have Supabase project ID: yxakmdoiivaiyjcdaxny
- [ ] Can access Supabase console
- [ ] SQL Editor is accessible

### Migration Execution

#### Query 1: Create Tables and Schema
- [ ] Go to: https://app.supabase.com
- [ ] Select project: Beautiful Gate
- [ ] Click: SQL Editor → New Query
- [ ] Copy entire migration SQL from `COMPLETE_FRESH_DEPLOYMENT_GUIDE.md`
- [ ] Paste into editor
- [ ] Click: RUN button
- [ ] Wait: Shows "success" message
- [ ] No errors in output

#### Query 2: Get Company ID
- [ ] Create new query
- [ ] Paste:
```sql
SELECT id FROM companies WHERE slug = 'beautiful-gate';
```
- [ ] Click: RUN
- [ ] Copy the UUID result

#### Query 3: Backfill Data
- [ ] Create new query
- [ ] Paste (replace YOUR_UUID):
```sql
UPDATE users SET company_id = 'YOUR_UUID' WHERE company_id IS NULL;
UPDATE products SET company_id = 'YOUR_UUID' WHERE company_id IS NULL;
UPDATE sales SET company_id = 'YOUR_UUID' WHERE company_id IS NULL;
UPDATE refresh_tokens SET company_id = 'YOUR_UUID' WHERE company_id IS NULL;
```
- [ ] Click: RUN
- [ ] No errors

#### Query 4: Verify
- [ ] Create new query
- [ ] Paste:
```sql
SELECT COUNT(*) as company_count FROM companies;
SELECT COUNT(*) as users_with_company FROM users WHERE company_id IS NOT NULL;
SELECT COUNT(*) as products_with_company FROM products WHERE company_id IS NOT NULL;
SELECT * FROM companies WHERE slug = 'beautiful-gate';
```
- [ ] Click: RUN
- [ ] Results show:
  - company_count: 1
  - users_with_company: (number >= 0)
  - products_with_company: (number >= 0)
  - One Beautiful Gate company row

**Time**: 5-10 minutes

---

## Phase 4: System Testing

### Test 1: Backend API
- [ ] Method: GET
- [ ] URL: `https://beautiful-gate-pos-api.onrender.com/api/test`
- [ ] Expected: `{"success":true,"message":"API is working",...}`
- [ ] Status: ✅ PASS

### Test 2: Frontend Loads
- [ ] URL: `https://beautiful-gate-client.onrender.com`
- [ ] Expected: Page loads, registration or login visible
- [ ] Status: ✅ PASS

### Test 3: Company Registration
- [ ] Go to: `https://beautiful-gate-client.onrender.com/register-company`
- [ ] Fill:
  - Company Name: `Test Company`
  - Slug: `test-company`
  - Admin Email: `admin@test.com`
  - Admin Password: `SecurePass123`
- [ ] Click: Register
- [ ] Expected: Success message (not 500 error)
- [ ] Status: ✅ PASS

### Test 4: Login
- [ ] Go to: `https://beautiful-gate-client.onrender.com`
- [ ] Fill:
  - Email: `admin@test.com`
  - Password: `SecurePass123`
- [ ] Click: Login
- [ ] Expected: Dashboard loads
- [ ] Expected: Header shows "Test Company" (not "Beautiful Gate")
- [ ] Status: ✅ PASS

### Test 5: Multi-Tenancy
- [ ] Register second company:
  - Company Name: `Another Company`
  - Slug: `another-company`
  - Admin Email: `admin2@test.com`
  - Admin Password: `SecurePass123`
- [ ] Login with admin2
- [ ] Expected: Header shows "Another Company"
- [ ] Expected: Dashboard shows only this company's data
- [ ] Expected: No data from "Test Company" visible
- [ ] Status: ✅ PASS

### Test 6: Data Isolation
- [ ] Login as admin@test.com (Test Company)
- [ ] Verify: See only Test Company data
- [ ] Logout
- [ ] Login as admin2@test.com (Another Company)
- [ ] Verify: See only Another Company data
- [ ] Verify: No cross-company data leakage
- [ ] Status: ✅ PASS

**Time**: 5-10 minutes

---

## Post-Deployment Verification

### System Status
- [ ] Backend: 🟢 Live and responding
- [ ] Frontend: 🟢 Live and accessible
- [ ] Database: ✅ Migration complete
- [ ] API: ✅ All endpoints responding
- [ ] Multi-tenancy: ✅ Working and isolated

### Code Quality
- [ ] No console errors in browser (F12)
- [ ] No errors in Render backend logs
- [ ] No errors in Render frontend logs
- [ ] No 500 errors on API calls
- [ ] No CORS errors

### Features Verified
- [ ] Company registration works
- [ ] User authentication works
- [ ] Company branding works
- [ ] Data isolation works
- [ ] Dashboard loads without errors

---

## Summary

### Completed Tasks
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Database migrated
- [ ] Data backfilled
- [ ] All tests passed

### System Status
- [ ] ✅ Production ready
- [ ] ✅ Multi-tenant functional
- [ ] ✅ Data isolated
- [ ] ✅ All features working

### Next Steps (After Checklist)
1. Load testing with multiple users
2. Feature testing (products, sales, dashboard)
3. Security audit
4. Performance benchmarking
5. Go-live preparation

---

## Quick Command Reference

```bash
# Test backend
curl https://beautiful-gate-pos-api.onrender.com/api/test

# Test company registration
curl -X POST https://beautiful-gate-pos-api.onrender.com/api/companies/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test",
    "slug": "test",
    "adminEmail": "admin@test.com",
    "adminPassword": "SecurePass123"
  }'
```

---

## Troubleshooting Quick Links

- Backend won't start? → Check Render logs
- Frontend won't load? → Check build completed
- Registration returns 500? → Check database migration
- Login fails? → Clear browser cache (F12)
- Data isolation wrong? → Check backfill migration ran

---

## Support Resources

| Issue | Document |
|-------|----------|
| Need deployment help | `COMPLETE_FRESH_DEPLOYMENT_GUIDE.md` |
| Database setup | `CRITICAL_DATABASE_SETUP_REQUIRED.md` |
| Testing procedures | `BACKEND_LIVE_TESTING_GUIDE.md` |
| Troubleshooting | `COMPLETE_FRESH_DEPLOYMENT_GUIDE.md` → Troubleshooting section |

---

## Time Tracking

| Phase | Estimated | Actual | Status |
|-------|-----------|--------|--------|
| Pre-Deployment | 7 min | - | Pending |
| Backend Deploy | 5 min | - | Pending |
| Frontend Deploy | 5 min | - | Pending |
| DB Migration | 8 min | - | Pending |
| Testing | 8 min | - | Pending |
| **Total** | **33 min** | - | Pending |

---

**Status**: Ready to start deployment ✅

**Next**: Start with Phase 1 backend deployment!

