# 📱 GitHub & Render Deployment Guide

**Status**: Code is ready to push ✅  
**Next Step**: Create GitHub repository

---

## STEP 1: Create Repository on GitHub

### Quick Setup (3 minutes):

1. **Go to GitHub**: https://github.com/devoops35-hub
2. **Click**: "+" icon (top right) → **"New repository"**
3. **Fill in**:
   - Repository name: `beautiful-gate-pos`
   - Description: `Beautiful Gate POS System - Production Ready`
   - Visibility: **Public** (needed for Render)
   - ✅ Check: "Add a README file" (optional)
   - ✅ Check: "Add .gitignore" (already have one)
4. **Click**: "Create repository"

### Result:
You'll see a page with:
```
- Your repository is ready!
- Clone with HTTPS: https://github.com/devoops35-hub/beautiful-gate-pos.git
```

---

## STEP 2: Push Code to GitHub

After creating the repository, you have 2 options:

### Option A: Using Git Command (Recommended)
```bash
# We've already configured this, so just run:
git push -u origin main

# You'll be asked to authenticate:
# - Username: devoops35-hub (or your email)
# - Password: Your GitHub personal access token (NOT your password)
```

### Option B: Using GitHub CLI
```bash
# If you have GitHub CLI installed:
gh repo create beautiful-gate-pos --public --source=. --push
```

### Option C: Using Git GUI
- GitHub Desktop app
- Visual Studio Code Git extension

---

## Getting GitHub Personal Access Token

Since GitHub deprecated password authentication, you need a Personal Access Token:

1. **Go to**: https://github.com/settings/tokens
2. **Click**: "Generate new token" → "Generate new token (classic)"
3. **Fill in**:
   - Token name: `git-push-token`
   - Expiration: 90 days (or what you prefer)
   - Scopes: Check `repo` (all sub-options)
4. **Click**: "Generate token"
5. **Copy** the token (you won't see it again!)
6. **Use** this token as your password when git asks

---

## STEP 3: Verify Push Was Successful

After pushing, verify on GitHub:

1. **Go to**: https://github.com/devoops35-hub/beautiful-gate-pos
2. **You should see**:
   - ✅ Code files displayed
   - ✅ Branch: main
   - ✅ Initial commit listed

---

## STEP 4: Deploy Backend to Render

Once code is on GitHub:

1. **Go to**: https://render.com
2. **Sign up** (use GitHub login for easier setup)
3. **Dashboard** → **"New +"** → **"Web Service"**
4. **Connect GitHub**:
   - Click "Connect account"
   - Authorize Render to access GitHub
   - Select repository: `devoops35-hub/beautiful-gate-pos`
5. **Configure Service**:
   - Name: `beautiful-gate-api`
   - Environment: `Node`
   - Region: `Frankfurt` (or closest to Ghana)
   - Branch: `main`
   - Root Directory: `server` ← Important!
   - Build Command: `npm install`
   - Start Command: `npm start`
   - **Add Environment Variables**:

```
NODE_ENV=production
JWT_SECRET=ZXc2UGRrTHc4TjNyRjJTOW1PQk5uNW9rSDJ6TUhndU1GSXo4SFdlb1lJST0=
PAYSTACK_SECRET_KEY=sk_test_ffd8631aa98fd6283e54eadaacf24cde6f1be542
PAYSTACK_PUBLIC_KEY=pk_test_e5af73a9cfd63af75c2c0e4e92a56d0db1eb8ea0
CORS_ORIGIN=https://beautiful-gate-web.onrender.com
VITE_SUPABASE_URL=https://yxakmdoiivaiyjcdaxny.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4YWttZG9paXZhaXlqY2RheG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MDgyNTEsImV4cCI6MjA5NjQ4NDI1MX0.gR2mEwQEXqsxLMNaUDdFlixY13AmqI5rEN05_46l4Nk
```

6. **Click**: "Create Web Service"
7. **Wait**: ~3-5 minutes for deployment
8. **You'll get**: A URL like `https://beautiful-gate-api.onrender.com`

---

## STEP 5: Deploy Frontend to Render

1. **Dashboard** → **"New +"** → **"Static Site"**
2. **Connect GitHub Repository** (same as before)
3. **Configure**:
   - Name: `beautiful-gate-web`
   - Root Directory: `client` ← Important!
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
4. **Add Environment Variables**:

```
VITE_API_URL=https://beautiful-gate-api.onrender.com
VITE_PAYSTACK_PUBLIC_KEY=pk_test_e5af73a9cfd63af75c2c0e4e92a56d0db1eb8ea0
VITE_SUPABASE_URL=https://yxakmdoiivaiyjcdaxny.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4YWttZG9paXZhaXlqY2RheG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MDgyNTEsImV4cCI6MjA5NjQ4NDI1MX0.gR2mEwQEXqsxLMNaUDdFlixY13AmqI5rEN05_46l4Nk
```

5. **Click**: "Create Static Site"
6. **Wait**: ~5-10 minutes for build and deployment
7. **You'll get**: A URL like `https://beautiful-gate-web.onrender.com`

---

## STEP 6: Update Backend CORS for Frontend

After frontend is deployed:

1. **Go to Backend Service** (beautiful-gate-api) on Render
2. **Environment** tab
3. **Find**: `CORS_ORIGIN`
4. **Update to**: `https://beautiful-gate-web.onrender.com`
5. **Redeploy**: Service will automatically redeploy

---

## Final URLs

After everything is deployed:

- **Frontend**: `https://beautiful-gate-web.onrender.com`
- **Backend API**: `https://beautiful-gate-api.onrender.com`
- **Database**: Supabase (already working)

---

## Testing After Deployment

1. **Open Frontend**: https://beautiful-gate-web.onrender.com
2. **Test Login**:
   - Use test credentials
   - Or register new account
3. **Test Products**: Add products to inventory
4. **Test Payment**: Process a test transaction
5. **Verify Database**: Check Supabase for saved data

---

## Troubleshooting

### "Repository not found"
- Make sure repository is set to **Public**
- Check repository name is correct
- Verify personal access token is valid

### Backend won't start
- Check environment variables are set correctly
- Look at Render logs for errors
- Verify Node version is 18+

### Frontend won't load
- Check `VITE_API_URL` points to backend
- Verify backend is running
- Check browser console for errors

### Payment not working
- Verify Paystack keys are correct
- Make sure Supabase is connected
- Check database settings table

---

## Important Notes

⚠️ **Free Tier Limitations**:
- Backend sleeps after 15 min of inactivity (~30 sec to wake)
- Frontend is always active
- Supabase free tier has generous limits

💡 **For Production**:
- Use paid Render tiers ($7+/month) to avoid sleep
- Use live Paystack keys (not test keys)
- Set up custom domain name

📱 **Mobile Money (Ghana)**:
- Phone field accepts +233 or 0 prefix
- Automatically converts to +233XXXXXXXXX
- Perfect for Ghana Cedi transactions

---

## Next Steps

1. ✅ Create GitHub repository
2. ✅ Push code (using token for auth)
3. ✅ Deploy backend to Render
4. ✅ Deploy frontend to Render
5. ✅ Test live application
6. ✅ You're live! 🚀

---

**Time to Live**: ~20-30 minutes total

Good luck! 🎉
