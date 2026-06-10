# Phase 2 Setup Guide

Complete setup instructions for Phase 2 production readiness features.

---

## Table of Contents

1. [Installation](#installation)
2. [Database Migration](#database-migration)
3. [Configuration](#configuration)
4. [Testing](#testing)
5. [Creating Admin Users](#creating-admin-users)
6. [Verification](#verification)
7. [Backup & Recovery](#backup--recovery)

---

## Installation

### 1. Install New Dependencies

```bash
cd server
npm install
```

This installs:
- `express-rate-limit` - Rate limiting middleware
- `winston` - Logging library
- `winston-daily-rotate-file` - Log file rotation

Verify installation:
```bash
npm list express-rate-limit winston
```

### 2. Verify Files Are Created

```bash
# Check middleware files
ls -la middleware/
# Should include: authMiddleware.js, rateLimiter.js, rbacMiddleware.js, 
#                 requestLogger.js, auditMiddleware.js

# Check config files
ls -la config/
# Should include: logger.js

# Check utilities
ls -la utils/
# Should include: refreshTokenManager.js, errorHandler.js

# Check controllers
ls -la controllers/
# Should include: auditController.js, adminController.js

# Check routes
ls -la routes/
# Should include: audit.js, admin.js

# Check scripts
ls -la scripts/
# Should include: backup.sh, backup.bat, migrate.js

# Check Docker files
ls -la
# Should include: Dockerfile, .dockerignore, docker-compose.yml
```

---

## Database Migration

### Run Migration Script

```bash
# From server directory
node scripts/migrate.js
```

Output should show:
```
╔════════════════════════════════════════╗
║        Running Database Migrations      ║
╚════════════════════════════════════════╝

Running migration: Add role column to users...
✓ Added role column to users table
✓ Set default role for existing users

Running migration: Add user tracking fields...
✓ Added isActive column
✓ Added lastLoginAt column

Running migration: Create refresh_tokens table...
✓ Created refresh_tokens table
✓ Created index on refresh_tokens

Running migration: Create audit_logs table...
✓ Created audit_logs table
✓ Created index idx_audit_user_date
✓ Created index idx_audit_resource

Running migration: Create migrations table...
✓ Created migrations table

╔════════════════════════════════════════╗
║     All migrations completed! ✓        ║
╚════════════════════════════════════════╝
```

### Verify Database Schema

```bash
# Check users table has new columns
sqlite3 pos.db ".schema users"

# Check refresh_tokens table exists
sqlite3 pos.db ".schema refresh_tokens"

# Check audit_logs table exists
sqlite3 pos.db ".schema audit_logs"

# Count tables
sqlite3 pos.db ".tables"
```

---

## Configuration

### 1. Environment Variables

```bash
# Copy example file
cp .env.example .env

# Edit with your settings
nano .env
```

Required variables:
```env
# Server
NODE_ENV=production
PORT=3003

# JWT (generate with: openssl rand -base64 32)
JWT_SECRET=your-32-character-secret-key-here

# Paystack
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 2. Verify Environment

```bash
# Check .env file exists
ls -la .env

# Verify required variables
grep "JWT_SECRET" .env
grep "PAYSTACK_SECRET_KEY" .env
grep "PAYSTACK_PUBLIC_KEY" .env
```

### 3. Create Logs Directory

```bash
# Already created on first run, but ensure it exists
mkdir -p logs
ls -la logs/
```

---

## Testing

### 1. Start Development Server

```bash
# From server directory
npm run start
```

Expected output:
```
Connected to the SQLite database at: .../pos.db
SQLite tables initialized successfully.

╔════════════════════════════════════════╗
║  🚀 POS Server running on port 3003   ║
║  Environment: development             ║
║  Time: 10:30:45 AM                   ║
╚════════════════════════════════════════╝
```

### 2. Test Health Endpoint

```bash
curl http://localhost:3003/health
```

Response:
```json
{
  "success": true,
  "message": "Server is running",
  "environment": "development",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

### 3. Test Rate Limiting

```bash
# This should succeed (first attempt)
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'

# Run 10 times rapidly - should hit rate limit
for i in {1..10}; do
  curl -X POST http://localhost:3003/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    | jq '.success'
done

# After 5 attempts, should see:
# 429 Too Many Requests
```

### 4. Test Authentication Endpoints

```bash
# Register new user
curl -X POST http://localhost:3003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }' | jq '.'

# Expected response includes accessToken and refreshToken
```

### 5. Test Refresh Token

```bash
# Save token from registration response
TOKEN="your-refresh-token-here"

# Call refresh endpoint
curl -X POST http://localhost:3003/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$TOKEN\"}" | jq '.'
```

### 6. Test Protected Endpoints

```bash
# Get products (requires auth)
TOKEN="your-access-token-here"

curl http://localhost:3003/api/products \
  -H "x-auth-token: $TOKEN" | jq '.'
```

### 7. Check Logs

```bash
# View real-time logs
tail -f logs/app-*.log

# View in another terminal - repeat some requests
# You should see them logged

# View error logs
tail -f logs/error-*.log

# View audit logs
tail -f logs/audit-*.log

# View request logs
tail -f logs/requests-*.log
```

---

## Creating Admin Users

### Method 1: Using API (After First Admin User)

```bash
# First, get a user token from login
TOKEN="your-user-token"

# Create another admin user via API
curl -X POST http://localhost:3003/api/admin/users \
  -H "Content-Type: application/json" \
  -H "x-auth-token: $TOKEN" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "strongpassword123",
    "role": "admin"
  }' | jq '.'
```

### Method 2: Direct Database Update

```bash
# Connect to database
sqlite3 pos.db

# Find user ID to promote
SELECT _id, email, role FROM users;

# Update role to admin (replace 1 with actual user ID)
UPDATE users SET role = 'admin' WHERE _id = 1;

# Verify
SELECT _id, email, role FROM users WHERE _id = 1;

# Exit
.quit
```

### Method 3: Using Admin Controller

Create a utility script `scripts/create-admin.js`:

```javascript
const { dbGet, dbRun } = require('../config/db');
const bcrypt = require('bcryptjs');
const { SECURITY } = require('../config/constants');

const createAdmin = async () => {
  try {
    const email = process.argv[2];
    const password = process.argv[3];
    const name = process.argv[4] || 'Admin';

    if (!email || !password) {
      console.error('Usage: node create-admin.js <email> <password> [name]');
      process.exit(1);
    }

    // Hash password
    const salt = await bcrypt.genSalt(SECURITY.BCRYPT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await dbRun(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'admin']
    );

    console.log(`✓ Admin user created with ID: ${result.lastID}`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
```

Usage:
```bash
node scripts/create-admin.js admin@example.com password123 "Admin Name"
```

---

## Verification

### 1. Database Tables

```bash
# Connect to database
sqlite3 pos.db

# Check users table structure
.schema users
# Should have: _id, name, email, password, role, isActive, lastLoginAt, createdAt

# Check refresh_tokens table
.schema refresh_tokens
# Should exist with all expected columns

# Check audit_logs table
.schema audit_logs
# Should exist with all expected columns

# Count records
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM refresh_tokens;
SELECT COUNT(*) FROM audit_logs;

.quit
```

### 2. Middleware Integration

```bash
# Check if middleware is loaded
grep -n "requireAdmin\|rateLimiter\|requestLogger" server/index.js

# Should see references to all new middleware
```

### 3. Routes Registered

```bash
# Check routes file
grep "router\." server/routes/admin.js
grep "router\." server/routes/audit.js

# Should see all CRUD routes
```

### 4. Log Files

```bash
# Check logs directory created
ls -la logs/

# Files should be created after first request
# - app-YYYY-MM-DD.log
# - requests-YYYY-MM-DD.log
# - audit-YYYY-MM-DD.log
```

### 5. Backup Script

```bash
# Make backup script executable (Linux/macOS)
chmod +x scripts/backup.sh

# Run backup
./scripts/backup.sh

# Check backup file created
ls -la backups/

# Windows
scripts\backup.bat
```

### 6. Admin Endpoint Access

```bash
# Get admin token (login as admin user)
ADMIN_TOKEN="your-admin-token"

# Try admin endpoints
curl http://localhost:3003/api/admin/users \
  -H "x-auth-token: $ADMIN_TOKEN" | jq '.data[0]'

# Should see user list with role information
```

### 7. Audit Log Viewing

```bash
# Get audit logs
ADMIN_TOKEN="your-admin-token"

curl http://localhost:3003/api/audit/logs \
  -H "x-auth-token: $ADMIN_TOKEN" | jq '.data[0]'

# Should see audit events like LOGIN, CREATE, UPDATE, etc.
```

---

## Backup & Recovery

### Manual Backup

```bash
# Backup database
cp server/pos.db server/backups/pos_backup_$(date +%Y-%m-%d_%H-%M-%S).db

# Backup logs
tar czf server/backups/logs_backup_$(date +%Y-%m-%d).tar.gz server/logs/
```

### Automated Backup (Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/server && ./scripts/backup.sh

# List cron jobs
crontab -l
```

### Recovery

```bash
# Stop server
npm stop

# Restore from backup
cp server/backups/pos_backup_2024-01-15_02-00-00.db server/pos.db

# Verify database integrity
sqlite3 server/pos.db "PRAGMA integrity_check;"

# Restart server
npm start
```

### Backup Cleanup

```bash
# Keep only last 7 days
find server/backups -name "pos_backup_*.db" -mtime +7 -delete

# Verify
ls -lh server/backups/
```

---

## Troubleshooting

### Migration Failed

```bash
# Re-run migration with verbose output
node scripts/migrate.js

# Check for SQL errors
sqlite3 pos.db ".schema"

# If column already exists, that's OK - migration handles it
```

### Rate Limiting Not Working

```bash
# Check NODE_ENV setting
echo $NODE_ENV

# Rate limiting is disabled in development mode
# Set to production to test
export NODE_ENV=production

# Or edit middleware:
# skip: (req, res) => process.env.NODE_ENV === 'development'
```

### Logs Not Creating

```bash
# Check permissions
ls -la logs/
chmod 755 logs/

# Check disk space
df -h logs/

# Create logs directory manually if needed
mkdir -p logs
chmod 777 logs
```

### Admin Endpoints Return 403

```bash
# Check user role
sqlite3 pos.db "SELECT email, role FROM users WHERE email = 'your@email.com';"

# Update role if needed
sqlite3 pos.db "UPDATE users SET role = 'admin' WHERE email = 'your@email.com';"

# Logout and login again to update cache
```

### Docker Build Fails

```bash
# Clean build
docker-compose build --no-cache

# Check Docker version
docker --version

# View build logs
docker-compose build api 2>&1 | head -50
```

---

## Next Steps

After successful setup:

1. **Test in Development**: Run all features locally
2. **Test with Docker**: Build and run with docker-compose
3. **Deploy to Staging**: Follow DOCKER_GUIDE.md
4. **Setup Monitoring**: Configure log aggregation
5. **Setup Backups**: Test automated backup procedure
6. **Create Admin Users**: Set up admin accounts
7. **Migrate Existing Data**: If upgrading from Phase 1
8. **Test Recovery**: Verify backup/restore works
9. **Production Deployment**: Follow DEPLOYMENT_GUIDE.md

---

## Support

Issues? Check:
1. `PHASE_2_IMPROVEMENTS.md` - Feature documentation
2. `DOCKER_GUIDE.md` - Docker setup
3. `logs/app-*.log` - Application logs
4. `logs/error-*.log` - Error logs

---

**Created**: January 2024
**Last Updated**: January 2024
**Status**: Ready for Testing

