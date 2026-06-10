# PostgreSQL Installation - 3 Simple Steps

## Step 1: Download (1 minute)
Go to: https://www.postgresql.org/download/windows/

Click **"Download the installer"** → Choose latest version → Download the `.exe` file

---

## Step 2: Install (3 minutes)

Double-click the installer and follow these exact steps:

1. **Welcome** → Click **Next**
2. **License Agreement** → Accept → **Next**
3. **Installation Directory** → Keep default → **Next**
4. **Select Components** → Keep all checked → **Next**
5. **Data Directory** → Keep default → **Next**
6. **Database Superuser Password** → **Enter: `localdev1234`** → **Next**
7. **Port Number** → Keep **5432** → **Next**
8. **Pre-Installation Summary** → **Next**
9. **Ready to Install** → **Install**
10. Wait for completion → **Finish**

---

## Step 3: Create Database (2 minutes)

Open **PowerShell** and paste:

```powershell
psql -U postgres
```

When asked for password, type: `localdev1234`

Then paste:

```sql
CREATE DATABASE beautiful_gate_pos;
\q
```

You're done! ✅

---

## Step 4: Update .env (1 minute)

Edit `server/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=beautiful_gate_pos
DB_USER=postgres
DB_PASSWORD=localdev1234
DB_SSL=false
```

Remove the `DATABASE_URL` line.

---

## Step 5: Start Server (30 seconds)

```powershell
cd "c:\Users\XKUISIT\Downloads\Porject I\server"
npm start
```

---

## ✅ Expected Output

You should see:
```
✅ Connected to PostgreSQL Database
🚀 POS Server running on port 3003
```

---

## That's it! 🎉

Your server is now running with PostgreSQL!

---

## Later: Migrate to Supabase

Once you deploy to production, you can:
1. Create a Supabase project
2. Use the migration tools to move data
3. Update connection string

For now, develop locally with PostgreSQL.

**Start the installation now!** ⏱️
