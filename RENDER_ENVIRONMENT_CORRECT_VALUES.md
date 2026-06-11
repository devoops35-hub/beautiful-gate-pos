# 🔧 Render Environment Variables - Correct Values

## Current Backend Service on Render

**Service Name**: `beautiful-gate-pos-api`  
**Type**: Web Service  
**Region**: Frankfurt (eu-central-1)  
**Language**: Node.js  
**Status**: Running

---

## ✅ Environment Variables to Verify/Fix

Copy these EXACT values into your Render Environment variables:

### 1. APPLICATION CONFIGURATION

```
NAME: NODE_ENV
VALUE: production
```

```
NAME: PORT
VALUE: 3003
```

---

### 2. CORS CONFIGURATION (⚠️ THIS IS THE FIX)

```
NAME: CORS_ORIGIN
VALUE: https://beautiful-gate-pos-web.onrender.com
```

⚠️ **IMPORTANT**: This must match your actual frontend URL!
- If frontend is: `https://beautiful-gate-pos-web.onrender.com` → Use that
- If frontend changed: Update this to match

---

### 3. SECURITY - JWT

```
NAME: JWT_SECRET
VALUE: ZXc2UGRrTHc4TjNyRjJTOW1PQk5uNW9rSDJ6TUhndU1GSXo4SFdlb1lJST0=
```

**Note**: This is a 32-character Base64 encoded secret. Do NOT change this.

---

### 4. DATABASE - SUPABASE

```
NAME: VITE_SUPABASE_URL
VALUE: https://yxakmdoiivaiyjcdaxny.supabase.co
```

```
NAME: VITE_SUPABASE_ANON_KEY
VALUE: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4YWttZG9paXZhaXlqY2RheG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MDgyNTEsImV4cCI6MjA5NjQ4NDI1MX0.gR2mEwQEXqsxLMNaUDdFlixY13AmqI5rEN05_46l4Nk
```

---

### 5. PAYMENT - PAYSTACK

```
NAME: PAYSTACK_SECRET_KEY
VALUE: sk_test_ffd8631aa98fd6283e54eadaacf24cde6f1be542
```

⚠️ **Important**: This is a TEST key (sk_test_). For production, use live key (sk_live_).

```
NAME: PAYSTACK_PUBLIC_KEY
VALUE: pk_test_e5af73a9cfd63af75c2c0e4e92a56d0db1eb8ea0
```

⚠️ **Important**: This is a TEST key (pk_test_). For production, use live key (pk_live_).

---

## 🔍 How to Verify in Render

1. Go to: https://render.com/dashboard
2. Click on service: `beautiful-gate-pos-api`
3. Click tab: **"Environment"** (in left sidebar)
4. Verify each variable matches the values above
5. If any don't match:
   - Click the pencil icon
   - Update the value
   - Click "Save Changes"
   - Click "Manual Deploy" at the top

---

## ✨ Quick Checklist

After updating, verify:

- [ ] `CORS_ORIGIN` = `https://beautiful-gate-pos-web.onrender.com` ← **KEY FIX**
- [ ] `NODE_ENV` = `production`
- [ ] `JWT_SECRET` = `ZXc2UGRrTHc8N3rF2S9mOBNn...`
- [ ] `PAYSTACK_SECRET_KEY` = `sk_test_...`
- [ ] `PAYSTACK_PUBLIC_KEY` = `pk_test_...`
- [ ] `VITE_SUPABASE_URL` = `https://yxakmdoiivaiyjcdaxny.supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIs...`
- [ ] `PORT` = `3003`

---

## 🔐 Do NOT Change These

- `JWT_SECRET` - Changing this will invalidate all existing tokens
- `PAYSTACK_SECRET_KEY` - Changing this breaks payment verification
- `VITE_SUPABASE_ANON_KEY` - Changing this breaks database connection

---

## 🚀 After Updating

1. Click "Manual Deploy" 
2. Wait 3-5 minutes for redeploy
3. Open browser: https://beautiful-gate-pos-web.onrender.com
4. Try to login
5. **Should work now!** ✅

---

## 📋 Frontend Environment Variables (for reference)

If frontend environment variables are wrong, go to:

1. Service: `beautiful-gate-pos-web` (NOT the API)
2. Tab: "Environment"
3. Verify these values:

```
VITE_API_URL=https://beautiful-gate-pos-api.onrender.com
VITE_PAYSTACK_PUBLIC_KEY=pk_test_e5af73a9cfd63af75c2c0e4e92a56d0db1eb8ea0
VITE_SUPABASE_URL=https://yxakmdoiivaiyjcdaxny.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4YWttZG9paXZhaXlqY2RheG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MDgyNTEsImV4cCI6MjA5NjQ4NDI1MX0.gR2mEwQEXqsxLMNaUDdFlixY13AmqI5rEN05_46l4Nk
```

---

## 🎯 The Fix in One Sentence

**Update CORS_ORIGIN from `https://beautiful-gate-web.onrender.com` to `https://beautiful-gate-pos-web.onrender.com` (add "pos-")**

---

## 🆘 Still Not Working?

1. **Verify backend URL**: Check that frontend is calling `https://beautiful-gate-pos-api.onrender.com`
2. **Check browser console**: Open Developer Tools (`F12`), go to Console, copy the exact error
3. **Check backend logs**: In Render, click "Logs" tab on backend service, look for CORS errors
4. **Clear cache**: Hard refresh browser `Ctrl+F5`
5. **Wait**: Sometimes Render takes 5-10 minutes to fully propagate changes

---

## 📞 Debugging CORS Errors

When you see CORS error, the error message tells you:

```
Access to XMLHttpRequest at '[BACKEND_URL]' 
from origin '[FRONTEND_URL]' 
has been blocked by CORS policy
```

**Translation**:
- Backend URL: Where the request is going
- Frontend URL (origin): Where the request is coming from
- Problem: Backend's `CORS_ORIGIN` doesn't include the frontend URL

**Solution**: Add the frontend URL to `CORS_ORIGIN`

---

## ✅ When It Works

You'll see in browser console:
- ✅ No CORS errors
- ✅ Login successful message
- ✅ Dashboard loads with products
- ✅ No network errors

---

**You've got this! This is the final step!** 🚀
