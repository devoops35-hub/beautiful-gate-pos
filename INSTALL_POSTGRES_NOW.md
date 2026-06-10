# 🔧 Install PostgreSQL for Windows (5 minutes)

## Step 1: Download PostgreSQL

Go to: https://www.postgresql.org/download/windows/

Click **"Download the installer"** → Download the latest version (15 or 16)

---

## Step 2: Run the Installer

1. Double-click the downloaded `.exe` file
2. Click **"Next"** on welcome screen
3. Accept the license → **"Next"**
4. Choose installation folder (default is fine) → **"Next"**

---

## Step 3: IMPORTANT - Remember the Password

When you see this screen:

```
Password for database superuser (postgres):
[________________] 
```

**Enter a password and REMEMBER IT!**

Examples: `postgres` or `localdev1234`

Write it down!

---

## Step 4: Continue Installation

- Port: **5432** (default - don't change)
- Locale: default → **"Next"**
- Pre-install check → **"Next"**
- Ready to Install → **"Install"**

Wait for installation to complete...

---

## Step 5: Finish

- Uncheck "Launch Stack Builder" 
- Click **"Finish"**

---

## Step 6: Create the Database

Open **PowerShell** or **Command Prompt**:

```powershell
psql -U postgres
```

When prompted for password, enter what you set in Step 3

Then run:

```sql
CREATE DATABASE beautiful_gate_pos;
\q
```

---

## Step 7: Update .env

Edit `server/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=beautiful_gate_pos
DB_USER=postgres
DB_PASSWORD=localdev1234
DB_SSL=false
```

Replace `localdev1234` with the password you set in Step 3

---

## Step 8: Start the Server

In PowerShell:

```powershell
cd "c:\Users\XKUISIT\Downloads\Porject I\server"
npm start
```

---

## ✅ You Should See:

```
✅ Connected to PostgreSQL Database
🚀 POS Server running on port 3003
```

---

**Do this now and let me know when it's done!** 🚀
