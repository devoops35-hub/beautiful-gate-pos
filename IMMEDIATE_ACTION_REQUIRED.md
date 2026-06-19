# ⚠️ IMMEDIATE ACTION REQUIRED

**Issue**: Company registration failing with 500 error + CORS error  
**Root Cause**: Missing environment variables on Render  
**Time to Fix**: 5-10 minutes  
**Difficulty**: Easy (just copy-paste variables)

---

## 🚨 What's Wrong

When you tried to register a company, you got:
- ❌ CORS error: `net::ERR_BLOCKED_BY_RESPONSE.NotSameOrigin`
- ❌ 500 error: Server returned 500 status
- ❌ Failed to register company

**Why?** The backend Render service doesn't have the required environment variables set.

---

## ✅ Quick Fix (5 minutes)

### Step 1: Get Your Database URL

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings → Database**
4. Look for **Connection Pooling**
5. Find the PostgreSQL connection string
6. **Copy it** (should look like: `postgresql://postgres:password@...`)

### Step 2: Generate JWT Secret

Open terminal or command prompt and run:
```bash
openssl rand -base64 32
```

Copy the output (looks like: `QeT7mK9pL3fX...`)

### Step 3: Configure Render Environment

1. Go to: https://dashboard.render.com
2. Click your **backend service** (`beautiful-gate-api`)
3. Click **Settings** tab
4. Scroll to **Environment** section
5. Click **Add Variable** for each:

```
NODE_ENV = production
PORT = 3003
DATABASE_URL = (paste from Step 1)
JWT_SECRET = (paste from Step 2)
CORS_ORIGIN = https://beautiful-gate-client.onrender.com,https://localhost:5173
PAYSTACK_SECRET_KEY = pk_test_... (or your actual key)
PAYSTACK_PUBLIC_KEY = pk_test_... (or your actual key)
```

### Step 4: Restart Service

1. Click **Restart** button on service page
2. Wait 1-2 minutes
3. Watch logs - should say "Database connection established"

### Step 5: Test

1. Go to: https://beautiful-gate-client.onrender.com/register-company
2. Try registering again
3. Should work! ✅

---

## 📊 Complete Env Variables Needed

| Variable | Value | Where To Find |
|----------|-------|---------------|
| `NODE_ENV` | `production` | Just type it |
| `PORT` | `3003` | Just type it |
| `DATABASE_URL` | PostgreSQL connection string | Supabase → Settings → Database |
| `JWT_SECRET` | Generated string (32 chars) | Run: `openssl rand -base64 32` |
| `CORS_ORIGIN` | `https://beautiful-gate-client.onrender.com,https://localhost:5173` | Just type it |
| `PAYSTACK_SECRET_KEY` | Your Paystack test/live key | Paystack dashboard |
| `PAYSTACK_PUBLIC_KEY` | Your Paystack test/live key | Paystack dashboard |

---

## ⏱️ Timeline

- **Setting variables**: 3-5 minutes
- **Service restart**: 1-2 minutes
- **Testing**: 1-2 minutes
- **Total**: ~5-10 minutes

---

## ✨ After Fix

Once done:
- ✅ CORS error gone
- ✅ 500 error fixed
- ✅ Company registration works
- ✅ Backend operational
- ✅ Ready for full testing

---

## 🔗 Links You Need

- Render Dashboard: https://dashboard.render.com
- Supabase Dashboard: https://supabase.com/dashboard
- Frontend: https://beautiful-gate-client.onrender.com
- Backend: https://beautiful-gate-api.onrender.com

---

## 📖 Detailed Guide

For step-by-step screenshots and troubleshooting:
👉 **Read**: `RENDER_ENVIRONMENT_FIX.md`

---

## 🎯 Do This Now

1. **Copy** DATABASE_URL from Supabase
2. **Generate** JWT_SECRET locally
3. **Add** all 7 environment variables to Render
4. **Restart** backend service
5. **Test** company registration again

**That's it! System will start working!** ✅

