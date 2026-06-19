# 🔴 CRITICAL FIX: Set Supabase Credentials on Render

**Issue**: Company registration failing - database not connecting  
**Root Cause**: Supabase credentials not set as environment variables on Render  
**Solution**: Add SUPABASE_URL and SUPABASE_KEY to Render environment  
**Time**: 2-3 minutes

---

## 🚨 What's Happening

The backend is using hardcoded Supabase credentials as a fallback, but they're pointing to the wrong project or are invalid. The proper fix is to set the correct credentials via environment variables on Render.

---

## ✅ Quick Fix

### Step 1: Get Your Supabase Credentials

1. Go to: https://supabase.com/dashboard
2. Click your project
3. Go to **Settings → API**
4. Find these values:
   - **Project URL**: Should look like `https://yxakmdoiivaiyjcdaxny.supabase.co`
   - **Anon Key**: Should look like a long random string starting with `eyJ...`

5. Copy both values

### Step 2: Add to Render Environment

1. Go to: https://dashboard.render.com
2. Click backend service (`beautiful-gate-api`)
3. Click **Settings** tab
4. Go to **Environment** section
5. **Add these two variables**:

```
SUPABASE_URL = https://yxakmdoiivaiyjcdaxny.supabase.co
SUPABASE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4YWttZG9paXZhaXlqY2RheG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwMzk1MjMsImV4cCI6MTc2ODU3NTUyM30.cPXZ-k3fpOl4eT0NVTNcVQvL6KDU1_v-zOIMLWVHhEU
```

(Replace with your actual values from Supabase)

### Step 3: Restart Service

1. Click **Restart** button
2. Wait 1-2 minutes for restart
3. Check logs - should see:
   ```
   ✅ Supabase Config: url: ✅ Set, key: ✅ Set
   ✅ Connected to Supabase Database
   ```

### Step 4: Test Registration Again

1. Go to: https://beautiful-gate-client.onrender.com/register-company
2. Try registering
3. Should work! ✅

---

## 📝 Complete Render Environment Variables

Set all of these on Render for full functionality:

```
# Application
NODE_ENV = production
PORT = 3003

# Supabase Database
SUPABASE_URL = https://yxakmdoiivaiyjcdaxny.supabase.co
SUPABASE_KEY = (anon key from Supabase)

# Security
JWT_SECRET = (generated: openssl rand -base64 32)
CORS_ORIGIN = https://beautiful-gate-client.onrender.com,https://localhost:5173

# Payments (if using Paystack)
PAYSTACK_SECRET_KEY = sk_test_...
PAYSTACK_PUBLIC_KEY = pk_test_...
```

---

## 🔑 Where to Find Each Value

### SUPABASE_URL
```
Supabase Dashboard → Your Project → Settings → API → Project URL
Example: https://yxakmdoiivaiyjcdaxny.supabase.co
```

### SUPABASE_KEY
```
Supabase Dashboard → Your Project → Settings → API → Project API keys → Anon public
Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### JWT_SECRET
```
Generate locally:
  openssl rand -base64 32
Example: QeT7mK9pL3fXvN0jL2hM4bR5cS6dT7uV8wX9yZ0aB1cD2...
```

### CORS_ORIGIN
```
Just type: https://beautiful-gate-client.onrender.com,https://localhost:5173
```

### PAYSTACK Keys
```
Paystack Dashboard → Settings → API Keys → Secret/Public Key
```

---

## ✨ After Setting Variables

- ✅ Backend connects to Supabase
- ✅ CORS errors resolved
- ✅ Company registration works
- ✅ Users can be created
- ✅ Sales can be recorded
- ✅ All database operations functional

---

## 🧪 Verify Fix

After restarting, visit this URL:
```
https://beautiful-gate-api.onrender.com/health
```

You should see:
```json
{
  "success": true,
  "message": "Server is running",
  "environment": "production",
  "timestamp": "..."
}
```

If you see that, the database is connected! ✅

---

## 📞 If Still Not Working

1. **Check Supabase credentials are correct**
   - Verify URL matches your project
   - Verify Anon Key is not expired

2. **Check backend logs on Render**
   - Look for error messages
   - Should show connection status

3. **Restart service** after making changes

4. **Wait** 1-2 minutes for restart to complete

---

## ⏱️ Timeline

- Getting credentials: 1 min
- Adding to Render: 1 min
- Service restart: 1-2 min
- Testing: 1 min
- **Total: 3-5 minutes**

---

**Do this now and company registration will work!** ✅

