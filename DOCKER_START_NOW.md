# 🚀 Start Docker PostgreSQL Now

## Step 1: Open PowerShell or Command Prompt

Click the Windows Start menu and search for **"PowerShell"** or **"Command Prompt"**

---

## Step 2: Copy & Paste This Command

Paste this entire command into your terminal:

```powershell
docker run -d `
  --name beautiful-gate-postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=localdev1234 `
  -e POSTGRES_DB=beautiful_gate_pos `
  -p 5432:5432 `
  postgres:15-alpine
```

Press **Enter**

---

## Step 3: Verify It's Running

Run this command:
```powershell
docker ps
```

You should see output like:
```
CONTAINER ID   IMAGE                PORTS
abc123xyz      postgres:15-alpine   0.0.0.0:5432->5432/tcp   beautiful-gate-postgres
```

✅ If you see this, Docker is running!

---

## Step 4: Start the Server

Open a **NEW terminal window** and run:

```powershell
cd "c:\Users\XKUISIT\Downloads\Porject I\server"
npm start
```

You should see:
```
✅ Connected to PostgreSQL Database
✅ POS Server running on port 3003
```

---

## That's It! 🎉

Your system is now running with:
- ✅ Docker PostgreSQL database
- ✅ Node.js server on port 3003
- ✅ Ready for the client to connect

---

## Troubleshooting

### Command not found: "docker"
- Make sure Docker Desktop is installed: https://www.docker.com/products/docker-desktop
- After installing, restart your terminal

### Port 5432 already in use
- Another PostgreSQL is running
- Run: `docker stop beautiful-gate-postgres`
- Then try again

### Container fails to start
- Run: `docker logs beautiful-gate-postgres`
- This will show the error

---

## When You're Done

After starting the server, come back here and let me know! 
Then we'll verify everything is working. ✅
