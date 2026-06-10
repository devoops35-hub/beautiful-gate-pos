# ⚠️ Verify Your Supabase Credentials

## Error: Cannot Connect to Supabase

The host `db.yxakmdoiivaiyjcdaxny.supabase.co` is **not resolving**.

This could mean:
1. ❌ The project ID is incorrect
2. ❌ The project hasn't finished initializing
3. ❌ Network/firewall blocking connection
4. ❌ Typo in the host name

---

## Step 1: Verify Project ID

### Your Current Project ID:
```
yxakmdoiivaiyjcdaxny
```

### Verify It's Correct:

1. Go to: https://app.supabase.com
2. Look at the **URL in your browser**
   ```
   https://app.supabase.com/project/yxakmdoiivaiyjcdaxny
   ```
3. The last part (`yxakmdoiivaiyjcdaxny`) should match

✅ If it matches, project ID is correct

---

## Step 2: Get Correct Database Host

1. Go to Supabase Dashboard
2. Select your project
3. Click: **Settings** (bottom left)
4. Click: **Database** (left sidebar)

5. Look for **Connection String** section
6. Find this line:
   ```
   postgresql://postgres:PASSWORD@db.XXXXXXX.supabase.co:5432/postgres
   ```

7. Extract the host:
   ```
   db.XXXXXXX.supabase.co
   ```

**Copy this EXACT host** (don't type it manually - copy/paste)

---

## Step 3: Update .env

Edit `server/.env`:

```env
DB_HOST=db.yxakmdoiivaiyjcdaxny.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=localdev1234
DB_SSL=true
```

**Important:**
- ✅ Use the exact host from Supabase
- ✅ Don't type it manually (copy/paste)
- ✅ Include `.supabase.co` at the end

---

## Step 4: Check Project Status

### Is the Project Running?

1. In Supabase Dashboard
2. Look at the **Status** indicator (top right)
3. Should show: ✅ **Running** (green)

If it shows:
- ⏳ **Starting** → Wait 2-3 minutes
- ❌ **Error** → There's a problem with your project

---

## Step 5: Test Connection Again

After updating credentials:

```powershell
npm start
```

You should see:
```
✅ Connected to PostgreSQL Database
✅ POS Server running on port 3003
```

---

## 🔧 Common Issues & Fixes

### Issue: Name Resolution Failed
**Cause:** Host name is wrong or doesn't exist
**Fix:** 
1. Copy host from Supabase (don't type)
2. Make sure `.supabase.co` is included
3. Double-check no spaces or typos

### Issue: Connection Timeout
**Cause:** Project not fully initialized
**Fix:**
1. Wait 5 minutes for project to start
2. Refresh Supabase dashboard
3. Check project status shows "Running"

### Issue: Authentication Failed
**Cause:** Wrong password
**Fix:**
1. Go to Settings → Database
2. Click "Reset password"
3. Create new password
4. Update .env with new password

### Issue: SSL Error
**Cause:** DB_SSL set to false
**Fix:**
1. Make sure `DB_SSL=true` in .env
2. Supabase requires SSL

---

## ✅ Checklist

Before trying again:
- [ ] Project ID verified in URL
- [ ] Host copied (not typed) from Supabase
- [ ] `.supabase.co` included in host
- [ ] Password is correct
- [ ] `DB_SSL=true`
- [ ] No spaces or extra characters
- [ ] Project status shows "Running"

---

## 🆘 Still Not Working?

### Option 1: Start Fresh Project
1. Delete current project in Supabase
2. Create new project
3. Save credentials before anything else
4. Update .env with new credentials

### Option 2: Check Supabase Status
1. Go to https://status.supabase.com
2. Check if there are any issues

### Option 3: Use Local Database Temporarily
While troubleshooting Supabase:
```powershell
# Use Docker
docker run -d `
  --name postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=beautiful_gate_pos `
  -p 5432:5432 `
  postgres:15-alpine

# Update .env
DB_HOST=localhost
DB_PASSWORD=postgres

npm start
```

---

## Tell Me:

Please verify and send me:
1. **Your current host** from Supabase Settings → Database
2. **Your project ID** from the URL
3. **Project status** (Running/Starting/Error?)

Then I can help you fix it! 🔧
