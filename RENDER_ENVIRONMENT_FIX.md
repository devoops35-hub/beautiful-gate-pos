# 🔧 Render Environment Configuration Fix

**Issue**: Company registration returning 500 error with CORS errors  
**Root Cause**: Environment variables not properly set on Render  
**Solution**: Configure environment variables in Render dashboard

---

## 🚨 Issues Identified

### Issue 1: CORS Error
```
net::ERR_BLOCKED_BY_RESPONSE.NotSameOrigin
```
**Cause**: Backend CORS is not configured to accept requests from production frontend domain

### Issue 2: 500 Server Error
```
Status: 500 - Server error during registration
```
**Cause**: DATABASE_URL likely not set, or missing other required environment variables

---

## ✅ Solution: Configure Render Environment Variables

### Step 1: Go to Render Dashboard

1. Open: https://dashboard.render.com
2. Click on your **backend service** (`beautiful-gate-api`)
3. Go to **Settings** tab
4. Scroll down to **Environment** section

### Step 2: Add/Update Environment Variables

Add or update these variables:

```
NODE_ENV = production
PORT = 3003

DATABASE_URL = postgresql://user:password@host:5432/database
(Copy the full PostgreSQL connection string from Supabase)

JWT_SECRET = (generate with: openssl rand -base64 32)
CORS_ORIGIN = https://beautiful-gate-client.onrender.com,https://localhost:5173

PAYSTACK_SECRET_KEY = pk_live_... (or your test key)
PAYSTACK_PUBLIC_KEY = pk_live_... (or your test key)
```

### Step 3: Get Database URL from Supabase

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings → Database**
4. Find **Connection Pooling** section
5. Copy the connection string
6. Replace `[YOUR-PASSWORD]` with your actual password
7. Paste into Render as `DATABASE_URL`

---

## 📋 Complete Environment Variables Checklist

### Required Variables

```
□ NODE_ENV = production
□ PORT = 3003
□ DATABASE_URL = postgresql://... (from Supabase)
□ JWT_SECRET = (generate: openssl rand -base64 32)
□ CORS_ORIGIN = https://beautiful-gate-client.onrender.com,https://localhost:5173
□ PAYSTACK_SECRET_KEY = your-key
□ PAYSTACK_PUBLIC_KEY = your-key
```

### How to Generate JWT_SECRET

Run this command locally:
```bash
openssl rand -base64 32
```

Copy the output and paste it in Render as `JWT_SECRET`

---

## 🔍 Step-by-Step: Set Variables on Render

### For Backend Service (beautiful-gate-api)

1. **Click** on backend service in Render dashboard
2. **Click** "Settings" tab
3. **Scroll** to "Environment" section
4. **Click** "Add Variable"

Add each variable one by one:

**1. NODE_ENV**
- Key: `NODE_ENV`
- Value: `production`
- Click "Save"

**2. PORT**
- Key: `PORT`
- Value: `3003`
- Click "Save"

**3. DATABASE_URL**
- Key: `DATABASE_URL`
- Value: `postgresql://postgres:PASSWORD@db.XXXXX.supabase.co:5432/postgres`
- Click "Save"

**4. JWT_SECRET**
- Key: `JWT_SECRET`
- Value: `(paste the generated secret)`
- Click "Save"

**5. CORS_ORIGIN**
- Key: `CORS_ORIGIN`
- Value: `https://beautiful-gate-client.onrender.com,https://localhost:5173`
- Click "Save"

**6. PAYSTACK_SECRET_KEY**
- Key: `PAYSTACK_SECRET_KEY`
- Value: `pk_test_... or pk_live_...`
- Click "Save"

**7. PAYSTACK_PUBLIC_KEY**
- Key: `PAYSTACK_PUBLIC_KEY`
- Value: `pk_test_... or pk_live_...`
- Click "Save"

---

## 🔄 Restart Backend Service

After setting all variables:

1. Go back to service main page
2. Click **"Restart"** button (or wait for auto-restart if configured)
3. Watch logs to verify service starts successfully
4. Check for errors in the logs

---

## ✅ Verify Configuration

### Check Backend Logs

1. Backend service page → **Logs** tab
2. Look for messages like:
   ```
   ✅ Database connection established
   ✅ Server running on port 3003
   ✅ CORS configured
   ```

### Check Frontend Still Works

1. Visit: https://beautiful-gate-client.onrender.com
2. Should load without errors
3. No 404 errors in browser console

---

## 🧪 Test After Configuration

### Test 1: Backend Health Check
```bash
curl https://beautiful-gate-api.onrender.com/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "environment": "production",
  "timestamp": "..."
}
```

### Test 2: Company Registration
1. Go to: https://beautiful-gate-client.onrender.com/register-company
2. Fill in form:
   ```
   Company Name: Test Company
   Email: test@company.com
   Phone: +233501234567
   Address: Test Address
   Industry: Retail
   Admin Email: admin@test.com
   Password: TestPass123456
   ```
3. Click "Register"
4. Should see success message (no CORS error)

---

## 🐛 Troubleshooting

### Problem: Still getting CORS error

**Solution**:
1. Verify `CORS_ORIGIN` includes: `https://beautiful-gate-client.onrender.com`
2. Include trailing slash? No, don't include it
3. Multiple origins separated by comma? Yes
4. Service restarted after variable change? Restart if needed

**Quick Fix**:
```
CORS_ORIGIN = https://beautiful-gate-client.onrender.com,https://localhost:5173,*
```
(Using `*` temporarily for debugging, but use specific domains in production)

### Problem: Database connection error

**Solution**:
1. Verify DATABASE_URL format: `postgresql://user:password@host:5432/db`
2. Check password doesn't have special characters (or URL-encode them)
3. Verify Supabase database is accessible
4. Test connection locally first:
   ```bash
   psql postgresql://user:password@host:5432/database
   ```

### Problem: 500 Error on every request

**Solution**:
1. Check backend logs for specific error message
2. Common causes:
   - DATABASE_URL not set (shows connection error)
   - JWT_SECRET not set (shows "unauthorized" error)
   - Paystack keys missing (affects payment endpoints)
3. Set missing variables and restart

### Problem: Service keeps crashing

**Solution**:
1. Check logs for error messages
2. Usually means:
   - Database connection failed
   - Missing required env variables
   - Port already in use
3. Fix the specific error and restart

---

## 📝 Reference: All Required Env Variables

### Database Connection
```
DATABASE_URL = postgresql://user:password@host:5432/database
```

### Security & Authentication
```
JWT_SECRET = (32-character string, use: openssl rand -base64 32)
CORS_ORIGIN = https://beautiful-gate-client.onrender.com,https://localhost:5173
NODE_ENV = production
```

### Payment Gateway (Paystack)
```
PAYSTACK_SECRET_KEY = sk_test_... or sk_live_...
PAYSTACK_PUBLIC_KEY = pk_test_... or pk_live_...
```

### Port
```
PORT = 3003
```

---

## ✨ After Configuration

Once all environment variables are set and service restarts:

1. ✅ Backend service should be green (deployed)
2. ✅ CORS errors should be gone
3. ✅ Company registration should work
4. ✅ 500 errors should resolve
5. ✅ System ready for testing

---

## 🎯 Complete Workflow to Fix

1. **Open** Render dashboard
2. **Click** backend service
3. **Go to** Settings → Environment
4. **Add** each variable listed above
5. **Restart** service
6. **Wait** 1-2 minutes for restart
7. **Test** registration page again

**Expected Result**: Company registration works without errors!

---

## 📞 If Still Stuck

1. **Check backend logs**: Service page → Logs tab
2. **Look for specific errors**: Database, CORS, JWT, etc.
3. **Fix the error**: Follow troubleshooting section
4. **Restart service**: Click restart button
5. **Test again**: Repeat registration

---

**Remember**: Render auto-deploys when you push new code to GitHub. Environment variables must be set separately in the Render dashboard.

