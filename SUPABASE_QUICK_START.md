# Supabase Quick Start (5 Minutes)

## Step 1: Create Account (1 minute)

1. Go to: https://app.supabase.com
2. Click "Sign Up"
3. Use Email, Google, or GitHub
4. Verify email

---

## Step 2: Create Project (2-3 minutes)

1. Click "New Project"
2. Fill in:
   - **Project name**: `beautiful-gate-pos`
   - **Database password**: `postgres` (or create strong one)
   - **Region**: Pick closest to you (e.g., `us-east-1`)
3. Click "Create new project"
4. **Wait 2-3 minutes** for setup

---

## Step 3: Get Credentials (1 minute)

When project is ready:

1. Go to **Settings** → **Database**
2. Find connection details:
   - **Host**: `db.xxxxx.supabase.co`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: The password you created

Or copy the full **Connection String** (easier):
```
postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

---

## Step 4: Update .env (1 minute)

Edit `server/.env`:

**Option A: Connection String**
```env
DATABASE_URL=postgresql://postgres:postgres@db.abcdefg.supabase.co:5432/postgres
```

**Option B: Individual Parameters**
```env
DB_HOST=db.abcdefg.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=true
```

Replace `abcdefg` with your actual project ID!

---

## Step 5: Start Server (1 minute)

```powershell
npm install
npm start
```

**Expected output:**
```
✅ Connected to PostgreSQL Database
✅ POS Server running on port 3003
```

**Done! 🎉**

---

## Verify It Works

### Test 1: Health Check
```powershell
curl http://localhost:3003/health
```
Should return: `{"success": true, ...}`

### Test 2: Check Tables in Supabase
1. Go to Supabase Dashboard
2. Click **Table Editor**
3. Should see tables: `users`, `products`, `sales`, etc.

### Test 3: Try Registration
```powershell
curl -X POST http://localhost:3003/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123"
  }'
```
Should return: `{"success": true, ...}`

---

## That's It!

You now have:
- ✅ PostgreSQL database (hosted)
- ✅ Automatic backups
- ✅ SSL encryption
- ✅ Production-ready setup
- ✅ Free tier ($0/month)

---

## Common Issues

### "Connection refused"
- Check internet connection
- Verify host/port in .env
- Make sure `DB_SSL=true`

### "Invalid password"
- Double-check password (case-sensitive)
- Make sure no extra spaces

### Tables not showing
- Refresh Supabase dashboard
- Wait 10 seconds
- Check server logs

### Need more help?
See: `SUPABASE_SETUP.md` (full guide)

---

## Next: Deploy to Production

When ready to go live:

1. **Deploy backend:**
   - Vercel, Heroku, Railway, or any Node.js host
   - Use same `.env` (update DB credentials)

2. **Deploy frontend:**
   - Vercel, Netlify
   - Point to your backend URL

3. **Database:**
   - Keep using Supabase (already in cloud!)
   - Upgrade plan if needed

---

**Status**: ✅ Ready to go!
**Cost**: $0/month (free tier)
**Time invested**: 10 minutes
**Result**: Production-grade POS system 🚀
