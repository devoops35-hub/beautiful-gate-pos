# Phase 2: Quick Start Guide

## 🎯 What's New

Phase 2 adds enterprise-grade features:

✅ **Rate Limiting** - Prevent brute force attacks (5 attempts/15min on auth)
✅ **Winston Logging** - Comprehensive logging system with daily rotation
✅ **Refresh Tokens** - Improved authentication (15min access, 7day refresh)
✅ **Role-Based Access** - Admin & user roles with RBAC
✅ **Audit Trail** - Complete change tracking & compliance logging
✅ **Admin Dashboard** - User management endpoints
✅ **Docker Support** - One-command deployment with docker-compose
✅ **Auto Backup** - Scheduled database backups
✅ **Request Logging** - All API calls tracked with response times
✅ **Environment Config** - Dev/staging/production configurations

---

## ⚡ Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Run Database Migration
```bash
node scripts/migrate.js
```

**Output should show:**
```
✓ Added role column to users table
✓ Created refresh_tokens table
✓ Created audit_logs table
```

### 3. Update Environment
```bash
# No changes needed - existing .env works!
# But verify these are set:
echo $JWT_SECRET
echo $PAYSTACK_SECRET_KEY
echo $PAYSTACK_PUBLIC_KEY
```

### 4. Start Server
```bash
npm run start
```

**Look for:**
```
🚀 POS Server running on port 3003
Environment: development
```

### 5. Test Features
```bash
# Health check (unchanged)
curl http://localhost:3003/health

# Test refresh token endpoint (NEW)
curl -X POST http://localhost:3003/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"your-token-here"}'

# Test admin endpoints (NEW - requires admin user)
curl http://localhost:3003/api/admin/users \
  -H "x-auth-token: your-admin-token"

# Check logs
ls -la logs/
tail -f logs/app-*.log
```

---

## 🐳 Docker Deployment (3 commands)

```bash
# 1. Build images
docker-compose build

# 2. Start services
docker-compose up -d

# 3. Verify
curl http://localhost:3003/health
curl http://localhost:5173
```

**Done!** Both frontend & backend running in containers.

---

## 📊 New Features at a Glance

### Rate Limiting
- Login/Register: 5 attempts per 15 minutes
- General API: 100 requests per 15 minutes
- Public endpoints: 200 requests per 15 minutes
- Automatically disabled in development

### Logging (4 types)
- `logs/app-*.log` - Application logs
- `logs/error-*.log` - Errors only
- `logs/requests-*.log` - API requests with response times
- `logs/audit-*.log` - All user actions (30-day retention)

### Refresh Tokens
```javascript
// Old flow (still works):
POST /api/auth/login → { accessToken }

// New flow:
POST /api/auth/login → { accessToken, refreshToken }
// Access token expires in 15 minutes
// When expired, use refresh token:
POST /api/auth/refresh → { newAccessToken, newRefreshToken }
```

### Admin Endpoints (NEW)
```bash
# Get all users
GET /api/admin/users?page=1&limit=50
  -H "x-auth-token: admin-token"

# Create admin user
POST /api/admin/users
  -d '{"name":"John","email":"john@example.com","password":"pass","role":"admin"}'

# Change user role
PUT /api/admin/users/2/role
  -d '{"role":"admin"}'

# Deactivate/activate user
PUT /api/admin/users/2/deactivate
PUT /api/admin/users/2/activate

# View all audit logs
GET /api/audit/logs?limit=50
GET /api/audit/export?format=csv
```

### Audit Trail
Every action logged:
- User created/updated/deleted
- Product created/updated/deleted
- Sale recorded
- Settings changed
- User logged in/out
- Admin actions (role changes, deactivations, etc.)

---

## 🔒 Security Improvements

| Feature | Benefit |
|---------|---------|
| Rate Limiting | Stops brute force attacks |
| Refresh Tokens | More secure, shorter-lived access tokens |
| Audit Trail | Compliance (SOC 2, regulatory) |
| Role-Based Access | Admins can't modify user permissions accidentally |
| Logging | Detect suspicious activity patterns |
| IP Tracking | Know where logins/changes came from |

---

## 📋 Backward Compatibility

✅ **100% backward compatible with Phase 1**

- Old JWT tokens still work
- Existing endpoints unchanged
- All new features optional
- No breaking changes
- Smooth migration path

---

## 🗂️ New Files Created

### Middleware (Automatic on every request)
- `rateLimiter.js` - Enforces rate limits
- `rbacMiddleware.js` - Checks user roles
- `requestLogger.js` - Logs API calls
- `auditMiddleware.js` - Logs user actions

### Configuration
- `logger.js` - Winston logging setup

### Admin Features
- `adminController.js` - User management logic
- `admin.js` routes - Admin endpoints
- `auditController.js` - Audit log queries
- `audit.js` routes - Audit endpoints

### Utilities
- `refreshTokenManager.js` - Token generation/validation
- `backup.sh` / `backup.bat` - Database backup scripts
- `migrate.js` - Database migration script

### Docker
- `Dockerfile` - Container definition
- `docker-compose.yml` - Multi-container orchestration

---

## 📖 Documentation

### Setup & Deployment
- `PHASE_2_SETUP.md` - Detailed setup instructions
- `DOCKER_GUIDE.md` - Complete Docker reference
- `DEPLOYMENT_GUIDE.md` - Production deployment

### Features
- `PHASE_2_IMPROVEMENTS.md` - Feature deep dive
- Code comments throughout

---

## ⚠️ Important: Database Migration

**MUST run this BEFORE starting server with Phase 2:**

```bash
cd server
node scripts/migrate.js
```

This adds:
- `role` column to users table
- `isActive` & `lastLoginAt` columns
- `refresh_tokens` table
- `audit_logs` table

**The migration is safe:** If columns exist, they're skipped.

---

## 🚀 Next Steps

### Immediate (Testing)
1. Run database migration ✓
2. Start server and test endpoints
3. Create admin user (see next section)
4. Test admin features
5. Check logs in `logs/` directory
6. Test Docker deployment

### Create Admin User

**Option 1: API (after you have a regular user)**
```bash
# Get your access token from login response
TOKEN="your-access-token"

# Create another admin
curl -X POST http://localhost:3003/api/admin/users \
  -H "Content-Type: application/json" \
  -H "x-auth-token: $TOKEN" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "strongpassword123",
    "role": "admin"
  }'
```

**Option 2: Direct Database**
```bash
sqlite3 server/pos.db

# Find your user ID
SELECT _id, email, role FROM users;

# Make yourself admin (replace 1 with your ID)
UPDATE users SET role = 'admin' WHERE _id = 1;

# Verify
SELECT _id, email, role FROM users WHERE _id = 1;

.quit
```

**Option 3: Script**
```bash
node scripts/create-admin.js admin@example.com password123 "Admin Name"
```

---

## 📊 What Gets Logged

### Application Log (`app-*.log`)
```
[2024-01-15 10:30:45] INFO: User role updated
  adminId: 1
  userId: 2
  newRole: admin
```

### Request Log (`requests-*.log`)
```
API Request
  method: GET
  path: /api/products
  statusCode: 200
  responseTime: 145ms
  userId: 5
```

### Audit Log (`audit-*.log`)
```
Audit Event
  action: UPDATE_ROLE
  resource: user
  userId: 1
  resourceId: 2
  oldValue: { role: 'user' }
  newValue: { role: 'admin' }
```

### Error Log (`error-*.log`)
```
Error: Database connection failed
  {
    "stack": "...",
    "message": "ECONNREFUSED",
    "context": { "userId": 5 }
  }
```

---

## 🔧 Troubleshooting

### "Table 'users' already has column 'role'"
✅ This is OK! Migration script handles it gracefully. Just means it already ran.

### No logs appearing in `logs/` directory
```bash
# Check if directory exists
mkdir -p server/logs

# Check permissions
chmod 755 server/logs

# Restart server
npm run start
```

### Rate limiting blocking legitimate traffic
```bash
# Rate limiting is disabled in development
# To test in production mode:
export NODE_ENV=production
npm run start

# Adjust limits in server/middleware/rateLimiter.js if needed
```

### Docker container won't start
```bash
# Check logs
docker-compose logs api

# Try rebuild
docker-compose build --no-cache api
```

---

## 📞 Still Have Questions?

Check these files:
1. **Setup issues** → `PHASE_2_SETUP.md`
2. **Docker issues** → `DOCKER_GUIDE.md`
3. **Deployment** → `DEPLOYMENT_GUIDE.md`
4. **Feature details** → `PHASE_2_IMPROVEMENTS.md`
5. **Runtime logs** → `server/logs/app-*.log`

---

## ✅ Checklist

- [ ] Ran `npm install`
- [ ] Ran `node scripts/migrate.js`
- [ ] Server starts without errors
- [ ] `logs/` directory created with log files
- [ ] Created admin user
- [ ] Tested `/api/admin/users` endpoint (returns list)
- [ ] Tested `/api/audit/logs` endpoint (returns audit events)
- [ ] Docker runs successfully: `docker-compose up -d`
- [ ] Frontend accessible at `http://localhost:5173`
- [ ] Backend accessible at `http://localhost:3003/health`

---

## 🎉 You're Done!

Phase 2 is now running with:
- ✅ Rate limiting
- ✅ Advanced logging
- ✅ Refresh tokens
- ✅ Admin features
- ✅ Audit trail
- ✅ Docker deployment
- ✅ Auto backups
- ✅ Role-based access

**Status**: Ready for testing, staging, and production deployment!

---

**Need Help?** → Check `PHASE_2_SETUP.md` for detailed instructions
**Want to Deploy?** → See `DOCKER_GUIDE.md` or `DEPLOYMENT_GUIDE.md`
**Want Details?** → Read `PHASE_2_IMPROVEMENTS.md`

---

*Last Updated: January 2024*
*Ready for: Testing → Staging → Production*
