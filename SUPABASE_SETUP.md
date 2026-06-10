# Supabase Setup Guide - PostgreSQL Hosting

## What is Supabase?

Supabase is a **managed PostgreSQL database** service built on top of PostgreSQL. It's:
- ✅ Free tier (500MB storage, perfect for starting)
- ✅ No server maintenance needed
- ✅ Automatic backups
- ✅ Real-time updates built-in
- ✅ Authentication ready
- ✅ Production-grade

---

## Step 1: Create Supabase Account

1. Go to: https://app.supabase.com
2. Click "Sign Up"
3. Use Email or GitHub account
4. Verify email

---

## Step 2: Create a New Project

1. Click "New Project"
2. Fill in details:
   - **Project name**: `beautiful-gate-pos`
   - **Database password**: Create a strong password (save it!)
   - **Region**: Choose closest to you (e.g., us-east-1)
3. Click "Create new project"
4. Wait 2-3 minutes for setup to complete

---

## Step 3: Get Connection String

### Method A: Connection String (EASIEST)

1. In Supabase dashboard, go to **Settings** → **Database**
2. Copy the **"Connection string"** (looks like: `postgresql://...@...`)
3. Make sure it shows `[YOUR-PASSWORD]` 
4. Replace `[YOUR-PASSWORD]` with your actual database password

### Method B: Individual Parameters

In **Settings** → **Database** you'll see:
- **Host**: `db.xxxxx.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: Your password

---

## Step 4: Update .env File

### Option A: Using Connection String

Edit `server/.env`:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

### Option B: Using Individual Parameters

Edit `server/.env`:
```env
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD
DB_SSL=true
```

**Important**: 
- ✅ Replace `xxxxx` with your actual Supabase project ID
- ✅ Replace `YOUR_PASSWORD` with your database password
- ✅ Keep `DB_SSL=true` for Supabase (required)

Complete example:
```env
NODE_ENV=production
PORT=3003

DB_HOST=db.abcdefg123456.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=MySecurePassword123!
DB_SSL=true

JWT_SECRET=your_jwt_secret_key_here_32_chars_min

PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx

CORS_ORIGIN=http://localhost:5173
```

---

## Step 5: Test Connection

### In Supabase Dashboard

1. Go to **SQL Editor**
2. Click "New Query"
3. Paste:
```sql
SELECT NOW();
```
4. Click "Run"
5. Should see current timestamp ✅

### From Your Server

```powershell
# Install dependencies (if not already done)
npm install

# Start server
npm start

# Expected output:
# ✅ Connected to PostgreSQL Database
# ✅ POS Server running on port 3003
```

---

## Step 6: Verify in Supabase

After starting server, check Supabase:

1. Go to **Table Editor**
2. You should see tables created:
   - `users`
   - `products`
   - `sales`
   - `sale_products`
   - `settings`
   - `refresh_tokens`
   - `audit_logs`

✅ If tables appear, connection is working!

---

## Free Tier Limits

Supabase Free tier includes:
- ✅ 500 MB database storage
- ✅ 2 GB bandwidth/month
- ✅ Up to 50,000 rows
- ✅ No project suspension
- ✅ Email support

**Perfect for**: Development, testing, small production deployments

### When to Upgrade
- If you exceed 500MB storage
- If you need more than 50,000 rows
- High-traffic production use

---

## Advantages Over Local PostgreSQL

| Feature | Local | Supabase |
|---------|-------|----------|
| Setup Time | 5-10 min | 2-3 min |
| Maintenance | Manual | Automatic |
| Backups | Manual | Automatic |
| SSL/TLS | Optional | Required |
| Uptime | Depends on your PC | 99.99% SLA |
| Anywhere Access | Local only | Global |
| Cost | Free | Free (with upgrade option) |
| Data Security | Your responsibility | Enterprise-grade |

---

## Backup & Recovery

### Automatic Backups

Supabase automatically backs up your database daily. To restore:

1. Go to **Settings** → **Backups**
2. See list of daily backups
3. Click restore to any point in time
4. Takes 5-10 minutes to restore

### Manual Backup

```powershell
# Export data as SQL
pg_dump -h db.xxxxx.supabase.co -U postgres -d postgres > backup.sql

# Export as CSV
psql -h db.xxxxx.supabase.co -U postgres -d postgres -c "\COPY users TO 'users.csv' WITH CSV HEADER"
```

---

## Connection Tips

### Using pgAdmin with Supabase

1. Download pgAdmin: https://www.pgadmin.org/download/
2. Open pgAdmin
3. Right-click "Servers" → "Register" → "Server"
4. Fill in:
   - **Name**: `beautiful-gate-supabase`
   - **Host**: `db.xxxxx.supabase.co`
   - **Port**: `5432`
   - **Username**: `postgres`
   - **Password**: Your Supabase password
5. Click "Save"

Now you can manage your database graphically!

---

## Real-Time Features (Advanced)

Supabase includes **real-time updates**. To enable for your app:

```javascript
// In your React component
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

// Listen to changes
const subscription = supabase
  .from('products')
  .on('*', (payload) => {
    console.log('Product changed:', payload);
  })
  .subscribe();
```

---

## API Keys

Supabase provides API keys for client-side access:

1. Go to **Settings** → **API**
2. You'll see:
   - **Project URL**: Use this for client requests
   - **anon (public)**: Safe for browser
   - **service_role**: Keep secret!

### Your Backend Uses Database Credentials
- Host: `db.xxxxx.supabase.co`
- User: `postgres`
- Password: Your password

### Frontend Can Use Public Key
- Only for real-time and auth features
- Not needed for your current setup

---

## Troubleshooting

### "Connection refused"
- Check internet connection
- Verify host/port in .env
- Make sure `DB_SSL=true`
- Check Supabase project is running

### "FATAL: password authentication failed"
- Double-check password (case-sensitive)
- Regenerate password in Supabase settings

### "SSL connection error"
- Make sure `DB_SSL=true` in .env
- Don't set `DB_SSL=false` for Supabase

### "Relations do not exist"
- Server hasn't created tables yet
- Check server logs for errors
- Restart server: `npm start`

### Tables not appearing in Supabase UI
- Refresh the browser
- Check SQL Editor for existing tables
- Wait 10 seconds and refresh again

---

## Monitoring

### In Supabase Dashboard

1. **Database** section shows:
   - Connection count
   - Database size
   - Query performance

2. **Logs** section shows:
   - SQL queries
   - Errors
   - Performance metrics

### From Command Line

```sql
-- Check connections
SELECT count(*) FROM pg_stat_activity;

-- Check database size
SELECT pg_size_pretty(pg_database_size('postgres'));

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Cost Analysis

### Supabase Free Plan
- $0/month
- 500 MB storage
- Perfect for MVP and testing

### When to Upgrade
- **Pro Plan**: $25/month
  - 8 GB storage
  - Better performance
  - Priority support

### Example Costs
- Small startup: $0-25/month (free tier)
- Medium app: $25-100/month
- Large production: $100+/month

*Compare to: Local hosting costs + server maintenance + your time*

---

## Migration from Local to Supabase

If you start local and want to move to Supabase later:

```powershell
# 1. Export from local
pg_dump -h localhost -U postgres beautiful_gate_pos > migration.sql

# 2. Import to Supabase
psql -h db.xxxxx.supabase.co -U postgres -d postgres -f migration.sql

# 3. Update .env with Supabase credentials
# 4. Restart server
```

---

## Production Deployment

### Steps:
1. ✅ Create Supabase project
2. ✅ Configure .env with Supabase credentials
3. ✅ Test connection locally
4. ✅ Deploy to hosting (Vercel, Heroku, etc.)
5. ✅ Enable SSL in production

### Production .env:
```env
NODE_ENV=production
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=YOUR_STRONG_PASSWORD
DB_SSL=true
JWT_SECRET=VERY_LONG_SECURE_STRING
```

---

## Next Steps

1. ✅ Create Supabase account (2 min)
2. ✅ Create project (3 min)
3. ✅ Get connection string (1 min)
4. ✅ Update .env (2 min)
5. ✅ Test: `npm start` (1 min)

**Total time**: ~10 minutes

---

## Resources

- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Node.js PG Driver**: https://node-postgres.com/
- **Supabase Pricing**: https://supabase.com/pricing

---

## Questions?

### Connection Issues?
- Check host/port in .env
- Verify Supabase project is running
- Test: `psql -h db.xxxxx.supabase.co -U postgres`

### Database Issues?
- Check SQL Editor in Supabase
- View logs for errors
- Verify tables were created

### Performance Issues?
- Use `EXPLAIN ANALYZE` in SQL Editor
- Check indexes are created
- Monitor in Supabase dashboard

---

## Summary

✅ Supabase is the **perfect choice** for this project because:
- No local setup needed
- Automatic backups
- Enterprise-grade security
- Free tier is generous
- Scale as you grow
- Production-ready

**Estimated setup time**: 10 minutes
**Cost**: Free (with optional upgrades)
**Status**: Ready for production 🚀
