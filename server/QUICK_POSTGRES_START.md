# Quick PostgreSQL Setup (Windows)

## Option 1: Docker (EASIEST - Recommended)

### Prerequisites
- Docker Desktop installed: https://www.docker.com/products/docker-desktop

### Start PostgreSQL in Docker
```powershell
docker run -d `
  --name beautiful-gate-postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=beautiful_gate_pos `
  -p 5432:5432 `
  postgres:15-alpine
```

### Verify it's running
```powershell
docker ps
```

You should see: `beautiful-gate-postgres` with status `Up`

### Then start the server
```powershell
npm start
```

---

## Option 2: Install PostgreSQL Locally (Windows)

### Step 1: Download PostgreSQL
1. Go to: https://www.postgresql.org/download/windows/
<!-- 2. Download "Windows x86-64" version 15 or later -->
3. Run the installer

### Step 2: Installation Configuration
- Accept license agreement
- Choose installation directory (default OK)
- **IMPORTANT**: Remember the password for `postgres` user
- Port: 5432 (default)
- Locale: [default]
- Click "Next" → "Install" → "Finish"

### Step 3: Create Database
1. Open **Command Prompt** or **PowerShell**
2. Run:
```powershell
# Create the database
psql -U postgres -c "CREATE DATABASE beautiful_gate_pos;"

# Verify it was created
psql -U postgres -l
```

### Step 4: Update .env
Edit `server/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=beautiful_gate_pos
DB_USER=postgres
DB_PASSWORD=postgres
```

### Step 5: Start Server
```powershell
npm install
npm start
```

---

## Option 3: PostgreSQL via Chocolatey

If you have Chocolatey installed:
```powershell
choco install postgresql
```

Then follow steps 2-5 above.

---

## Verify Setup

### Check PostgreSQL is running
```powershell
# Windows Services
Get-Service postgres*
```

Should show: `Running`

### Test connection
```powershell
psql -U postgres -c "SELECT NOW();"
```

Should show current timestamp

### Test server health
```powershell
# In another terminal after starting npm
curl http://localhost:3003/health
```

Should return:
```json
{
  "success": true,
  "message": "Server is running",
  ...
}
```

---

## Troubleshooting

### "Database already exists"
This is OK - proceed to start the server

### "FATAL: database does not exist"
```powershell
psql -U postgres
CREATE DATABASE beautiful_gate_pos;
\q
```

### "port 5432 is already in use"
- Another PostgreSQL instance is running
- Or use Docker with different port: `-p 5433:5432`

### "connection refused"
- PostgreSQL not running
- Check with: `Get-Service postgres*`
- Start with: `Start-Service Postgres*` (if installed)

---

## Quick Test After Setup

```powershell
# 1. Start server
npm start

# 2. In another terminal, test registration
curl -X POST http://localhost:3003/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123"
  }'

# 3. Test login
curl -X POST http://localhost:3003/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "test@example.com",
    "password": "Test123"
  }'

# Expected: Both return {"success": true, ...}
```

---

## Stop/Remove PostgreSQL

### Docker
```powershell
# Stop container
docker stop beautiful-gate-postgres

# Remove container (deletes data!)
docker rm beautiful-gate-postgres

# Restart
docker start beautiful-gate-postgres
```

### Windows Service
```powershell
# Stop
Stop-Service postgres*

# Start
Start-Service postgres*
```

---

## Still Having Issues?

Read: `POSTGRES_SETUP.md` (Full setup guide with more options)
