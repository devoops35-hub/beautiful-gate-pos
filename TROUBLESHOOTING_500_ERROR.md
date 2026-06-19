# 🔧 Troubleshooting 500 Error on Company Registration

**Error**: `500 Server error during registration`  
**Frontend**: Company registration page fails  
**Root Cause**: One of three issues (see below)  

---

## 🎯 Quick Diagnosis

The 500 error is happening because one of these is missing:

1. **Supabase Credentials** ← Most likely
2. **CORS Configuration**
3. **JWT Secret**

---

## 🔍 Identify Which Issue

### Check the Backend Logs

1. Go to: https://dashboard.render.com
2. Click backend service (`beautiful-gate-api`)
3. Click **Logs** tab
4. Look for error messages

#### If you see: `Error connecting to Supabase`
👉 **Fix**: Set `SUPABASE_URL` and `SUPABASE_KEY` (see below)

#### If you see: `Invalid or malformed API key`
👉 **Fix**: Check your Supabase Anon Key is correct

#### If you see: `CORS error`
👉 **Fix**: Set `CORS_ORIGIN` to include your frontend domain

#### If you see: `JWT_SECRET not set`
👉 **Fix**: Generate and set `JWT_SECRET`

---

## ✅ Fix #1: Supabase Credentials (MOST LIKELY)

### The Problem
Backend can't connect to Supabase database

### The Solution

1. **Get credentials from Supabase**
   - Go to: https://supabase.com/dashboard
   - Click your project
   - Settings → API
   - Copy:
     - `Project URL` (example: `https://yxakmdoiivaiyjcdaxny.supabase.co`)
     - `Anon Key` (example: `eyJhbGciOiJIUzI1NiIs...`)

2. **Set on Render**
   - Go to: https://dashboard.render.com
   - Click backend service
   - Settings → Environment
   - Add variables:
     ```
     SUPABASE_URL = (paste Project URL)
     SUPABASE_KEY = (paste Anon Key)
     ```

3. **Restart service**
   - Click "Restart" button
   - Wait 1-2 minutes
   - Check logs say "✅ Connected to Supabase Database"

---

## ✅ Fix #2: CORS Configuration

### The Problem
Frontend can't call backend API due to CORS

### The Solution

1. **Set CORS_ORIGIN on Render**
   - Go to: https://dashboard.render.com
   - Click backend service
   - Settings → Environment
   - Add variable:
     ```
     CORS_ORIGIN = https://beautiful-gate-client.onrender.com,https://localhost:5173
     ```

2. **Restart service**
   - Click "Restart" button
   - Wait for restart

---

## ✅ Fix #3: JWT Secret

### The Problem
JWT token generation failing

### The Solution

1. **Generate JWT Secret locally**
   ```bash
   openssl rand -base64 32
   ```
   (Copy the output)

2. **Set on Render**
   - Go to: https://dashboard.render.com
   - Click backend service
   - Settings → Environment
   - Add variable:
     ```
     JWT_SECRET = (paste generated value)
     ```

3. **Restart service**

---

## 🧪 Complete Render Environment Setup

Set ALL of these to ensure nothing breaks:

```
# Application Config
NODE_ENV = production
PORT = 3003

# Supabase Database
SUPABASE_URL = https://yxakmdoiivaiyjcdaxny.supabase.co
SUPABASE_KEY = eyJhbGciOiJIUzI1NiIs...

# Security
JWT_SECRET = QeT7mK9pL3fXvN0jL2hM4bR5cS6dT7uV8wX9yZ0aB1cD2...
CORS_ORIGIN = https://beautiful-gate-client.onrender.com,https://localhost:5173

# Payments (Optional, but prevents errors)
PAYSTACK_SECRET_KEY = sk_test_...
PAYSTACK_PUBLIC_KEY = pk_test_...
```

---

## 📋 Step-by-Step Fix Guide

### Step 1: Get Supabase Credentials (1 min)

```
1. Go to https://supabase.com/dashboard
2. Click your project name
3. Click "Settings" (gear icon) on left sidebar
4. Click "API" in the submenu
5. You'll see:
   - Project URL (blue box) - COPY THIS
   - Project API keys section with "Anon public" key - COPY THIS
```

### Step 2: Add to Render (2 min)

```
1. Go to https://dashboard.render.com
2. Click on "beautiful-gate-api" service
3. Click "Settings" tab at top
4. Scroll down to "Environment" section
5. Click "Add Variable" button
6. Enter first variable:
   Key: SUPABASE_URL
   Value: (paste Project URL from step 1)
   Click "Save"
7. Click "Add Variable" button again
8. Enter second variable:
   Key: SUPABASE_KEY
   Value: (paste Anon Key from step 1)
   Click "Save"
```

### Step 3: Restart Service (2 min)

```
1. At top of service page, click "Restart" button
2. Wait for status to change to "Deploying"
3. Wait for it to say "Live" again (1-2 minutes)
4. Click on "Logs" tab to verify:
   - Look for: "✅ Connected to Supabase Database"
   - If you see that, database is connected!
```

### Step 4: Test (1 min)

```
1. Go to https://beautiful-gate-client.onrender.com/register-company
2. Fill in the form with test data
3. Click "Register"
4. Should see success message (no error)
```

---

## 🐛 Common Mistakes

### ❌ Mistake 1: Wrong Anon Key
**Problem**: Copied "Service Role Key" instead of "Anon Key"  
**Solution**: Make sure you copy the "Anon public" key, NOT "Service role secret"

### ❌ Mistake 2: Forgot to Restart
**Problem**: Set variables but forgot to restart service  
**Solution**: Always click "Restart" after changing environment variables

### ❌ Mistake 3: Typo in Variable Name
**Problem**: Typed `SUPABASE_URL_` instead of `SUPABASE_URL`  
**Solution**: Check variable names match exactly (case-sensitive)

### ❌ Mistake 4: Missing Trailing Slash
**Problem**: Included trailing slash in URL: `https://example.supabase.co/`  
**Solution**: Remove trailing slash: `https://example.supabase.co`

---

## ✅ Verification Checklist

After setting variables and restarting:

- [ ] Backend service shows "Live" (green)
- [ ] Logs show "Connected to Supabase Database"
- [ ] Health check works: `https://beautiful-gate-api.onrender.com/health`
- [ ] Company registration page loads: `https://beautiful-gate-client.onrender.com/register-company`
- [ ] Test registration succeeds (no 500 error)
- [ ] Success message appears: "Company registered successfully!"

---

## 🎯 If Still Not Working

1. **Check Supabase dashboard**
   - Is your project active?
   - Are the tables created?
   - Can you access the database?

2. **Check Render logs** for specific errors
   - Go to: https://dashboard.render.com
   - Click service → Logs
   - Look for red error messages
   - Search for "error" or "fail"

3. **Check credentials are correct**
   - Verify URL matches your Supabase project
   - Verify Key is the "Anon public" key
   - Try copying again if uncertain

4. **Contact Supabase support** if database is down

---

## 📞 Debug Mode: Enable Verbose Logging

If you still can't figure it out, you can add debug logging:

1. Edit `server/config/supabase.js`
2. Uncomment the console.log statements
3. Redeploy to Render
4. Check logs for detailed information

---

## ⏱️ Expected Timeline

- Getting Supabase credentials: 1-2 min
- Adding to Render: 2 min
- Service restart: 1-2 min
- Testing: 1 min
- **Total: 5-7 minutes**

---

## 🎉 Success

When company registration works:
- ✅ No 500 error
- ✅ No CORS error
- ✅ Company created in database
- ✅ Success message shows
- ✅ System ready for users

---

## 📚 Related Guides

- `CRITICAL_FIX_SUPABASE_CREDENTIALS.md` - Supabase setup (primary guide)
- `RENDER_ENVIRONMENT_FIX.md` - All environment variables
- `IMMEDIATE_ACTION_REQUIRED.md` - Quick reference

---

**Follow these steps and the 500 error will be gone!** ✅

