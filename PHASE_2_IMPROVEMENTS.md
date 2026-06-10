# Phase 2: Production Readiness - In Progress ⏳

## Overview

Phase 2 focuses on implementing advanced security, monitoring, and operational features to make the POS system enterprise-grade. This includes rate limiting, comprehensive logging, refresh token management, role-based access control, audit trails, and Docker containerization.

---

## What's Implemented

### ✅ 1. Rate Limiting Middleware

**File**: `server/middleware/rateLimiter.js`

#### Features:
- **Auth Limiter**: 5 requests per 15 minutes for login/register/refresh
- **General Limiter**: 100 requests per 15 minutes for API endpoints
- **Public Limiter**: 200 requests per 15 minutes for public endpoints
- **Refresh Limiter**: 10 requests per 15 minutes for token refresh
- **Upload Limiter**: 20 requests per hour for file uploads
- **Custom User Limiter**: Per-user rate limiting based on authenticated user ID
- Automatic bypass in development environment
- Proper error responses (429 Too Many Requests)

#### Usage:
```javascript
const { authLimiter, generalLimiter } = require('./middleware/rateLimiter');

app.post('/api/auth/login', authLimiter, loginController);
app.use('/api/', generalLimiter);
```

---

### ✅ 2. Comprehensive Logging System (Winston)

**File**: `server/config/logger.js`

#### Features:
- **Multiple Log Levels**: error, warn, info, debug
- **Separate Transports**:
  - Console (colored, development-friendly)
  - File logs (daily rotation, 14-day retention)
  - Error logs (daily rotation, 14-day retention)
  - Request logs (daily rotation, 7-day retention)
  - Audit logs (daily rotation, 30-day retention)
- **Daily Log Rotation**: Automatic file rotation based on date
- **Configurable Retention**: Different policies per log type
- **Error Context**: Stack traces and detailed error information
- **Request Tracking**: Method, path, status code, response time, user ID
- **Audit Logging**: Special logger for audit events
- **Exception Handling**: Uncaught exceptions logged to file

#### Usage:
```javascript
const { logger } = require('./config/logger');

logger.info('Operation successful', { userId: 123 });
logger.warn('Suspicious activity', { event: 'multiple_failed_logins' });
logger.logError('Operation failed', error, { context: 'details' });
logger.logRequest(method, path, status, responseTime, userId);
logger.logAudit(action, resource, userId, { details: 'info' });
```

#### Log Files:
- `logs/app-YYYY-MM-DD.log` - All application logs
- `logs/error-YYYY-MM-DD.log` - Error logs only
- `logs/requests-YYYY-MM-DD.log` - API request/response logs
- `logs/audit-YYYY-MM-DD.log` - Audit trail logs
- `logs/exceptions-YYYY-MM-DD.log` - Uncaught exceptions

---

### ✅ 3. Refresh Token Mechanism

**File**: `server/utils/refreshTokenManager.js`

#### Features:
- **Access Tokens**: 15-minute expiration
- **Refresh Tokens**: 7-day expiration
- **Token Storage**: Database-backed refresh token storage
- **Token Rotation**: Automatic token rotation on refresh
- **Token Revocation**: Individual token revocation on logout
- **Bulk Revocation**: Revoke all tokens for a user (logout all devices)
- **Token Cleanup**: Automatic cleanup of expired tokens
- **IP & User-Agent Tracking**: Track where tokens are used from

#### New Database Table: `refresh_tokens`
```sql
CREATE TABLE refresh_tokens (
  _id INTEGER PRIMARY KEY,
  userId INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expiresAt DATETIME NOT NULL,
  revokedAt DATETIME,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(_id) ON DELETE CASCADE
)
```

#### New Auth Endpoints:
- `POST /api/auth/refresh` - Get new access token using refresh token
- `POST /api/auth/logout` - Logout and revoke specific token
- `POST /api/auth/logout-all` - Logout from all devices

#### Usage:
```javascript
const { generateAccessToken, generateRefreshToken, storeRefreshToken, verifyRefreshToken } = require('./utils/refreshTokenManager');

// On login
const accessToken = generateAccessToken(userId);
const refreshToken = generateRefreshToken(userId);
await storeRefreshToken(userId, refreshToken, ipAddress, userAgent);

// On token refresh
const decoded = await verifyRefreshToken(refreshToken);
```

---

### ✅ 4. Role-Based Access Control (RBAC)

**File**: `server/middleware/rbacMiddleware.js`

#### Features:
- **User Roles**: 'user' (default) and 'admin'
- **Role Enforcement**: Middleware to check user roles
- **Admin Middleware**: `requireAdmin` - Enforces admin role
- **Flexible Role Check**: `requireRole` - Check multiple roles
- **Role Attachment**: `attachUserRole` - Optional role check
- **Database Persistence**: Roles stored in users table

#### Updated Users Table:
```sql
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN isActive BOOLEAN DEFAULT 1;
ALTER TABLE users ADD COLUMN lastLoginAt DATETIME;
```

#### Usage:
```javascript
const { requireAdmin, requireRole } = require('./middleware/rbacMiddleware');

// Require admin role
router.delete('/api/products/:id', authenticate, requireAdmin, deleteProduct);

// Require multiple roles
router.get('/api/reports', authenticate, requireRole(['admin', 'manager']), getReports);
```

#### Protected Endpoints (Admin Only):
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new admin
- `GET /api/admin/users/:userId` - Get user details
- `PUT /api/admin/users/:userId/role` - Change user role
- `PUT /api/admin/users/:userId/deactivate` - Deactivate user
- `PUT /api/admin/users/:userId/activate` - Activate user
- `PUT /api/admin/users/:userId/reset-password` - Reset password
- `GET /api/audit/logs` - View audit logs
- `GET /api/audit/stats` - View audit statistics

---

### ✅ 5. Request/Response Logging Middleware

**File**: `server/middleware/requestLogger.js`

#### Features:
- **Automatic Request Logging**: Method, path, IP, user-agent
- **Response Tracking**: Status code, response time calculation
- **Sensitive Data Filtering**: Redacts passwords and tokens
- **Error Logging**: Detailed logging for HTTP errors
- **Performance Metrics**: Response time in milliseconds
- **User Tracking**: Associates requests with user ID when authenticated

#### Middleware Stack:
- `requestLoggingMiddleware` - Logs all requests/responses with timing
- `detailedRequestLogger` - Logs detailed request info (body, query, headers)
- `errorLoggingMiddleware` - Logs request errors with context

#### Output Example:
```
[2024-01-15 10:30:45] API Request
  method: POST
  path: /api/auth/login
  statusCode: 200
  responseTime: 145ms
  userId: 5
  timestamp: 2024-01-15T10:30:45.123Z
```

---

### ✅ 6. Audit Trail for Transactions

**File**: `server/middleware/auditMiddleware.js`

#### Features:
- **Comprehensive Audit Logging**: All CRUD operations tracked
- **Change Tracking**: Old and new values for updates
- **User Tracking**: Which user performed the action
- **Resource Tracking**: What resource was modified
- **Metadata**: IP address, user-agent, timestamp
- **Event Types**: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.

#### New Database Table: `audit_logs`
```sql
CREATE TABLE audit_logs (
  _id INTEGER PRIMARY KEY,
  userId INTEGER,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resourceId INTEGER,
  oldValue TEXT,
  newValue TEXT,
  details TEXT,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(_id) ON DELETE SET NULL
)
```

#### Audit Events Logged:
- User Registration (REGISTER)
- User Login (LOGIN)
- User Logout (LOGOUT)
- Logout All Devices (LOGOUT_ALL)
- Product Create (CREATE)
- Product Update (UPDATE)
- Product Delete (DELETE)
- Sale Create (CREATE)
- User Role Changes (UPDATE_ROLE)
- User Deactivation (DEACTIVATE)
- User Activation (ACTIVATE)
- Password Reset (RESET_PASSWORD)
- Settings Changes (UPDATE)

#### Audit Endpoints (Admin Only):
- `GET /api/audit/logs` - Query audit logs with filters
- `GET /api/audit/user/:userId` - Get specific user's audit history
- `GET /api/audit/stats` - Audit statistics and analytics
- `GET /api/audit/export` - Export logs as CSV or JSON

#### Usage:
```javascript
const { logAuditEvent } = require('./middleware/auditMiddleware');

await logAuditEvent(userId, 'CREATE', 'product', productId, {
  newValue: productData,
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
});
```

---

### ✅ 7. Docker Containerization

#### Files Created:
- `server/Dockerfile` - Backend container definition
- `client/Dockerfile` - Frontend container definition
- `docker-compose.yml` - Multi-container orchestration
- `server/.dockerignore` - Files to exclude from image

#### Features:
- **Alpine Linux**: Minimal, secure base images
- **Health Checks**: Automatic service health monitoring
- **Volume Mounts**: Persistent database and logs
- **Environment Configuration**: Configurable via env vars
- **Network Isolation**: Services communicate via docker network
- **Service Dependencies**: Frontend waits for API health
- **Production Ready**: Optimized for production deployment

#### Docker Images:
- Backend: `node:18-alpine` (lightweight, secure)
- Frontend: Two-stage build (builder + production)

#### Environment Variables in Docker:
```env
NODE_ENV=production
PORT=3003
JWT_SECRET=your-secret-key
PAYSTACK_SECRET_KEY=sk_...
PAYSTACK_PUBLIC_KEY=pk_...
CORS_ORIGIN=http://localhost:5173
VITE_API_URL=http://api:3003
```

#### Volumes:
- `./server/pos.db:/app/pos.db` - Database persistence
- `./server/logs:/app/logs` - Log file persistence
- `./server/backups:/app/backups` - Backup storage

#### Health Checks:
- Backend: HTTP GET `/health` (30s interval, 3s timeout)
- Frontend: Wget spider check (30s interval, 3s timeout)

#### Usage:
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api
docker-compose logs -f web

# Stop services
docker-compose down

# Rebuild images
docker-compose build --no-cache
```

---

### ✅ 8. Database Backup Strategy

**Files**:
- `server/scripts/backup.sh` - Linux/macOS backup script
- `server/scripts/backup.bat` - Windows batch backup script
- `server/scripts/migrate.js` - Database migration script

#### Backup Features:
- **Automated Daily Backups**: Easy cron/task scheduler integration
- **Retention Policy**: Keep last 7 days (configurable)
- **File Naming**: `pos_backup_YYYY-MM-DD_HH-MM-SS.db`
- **Directory Management**: Auto-creates backup directory
- **Progress Reporting**: Detailed backup status output
- **Size Reporting**: Shows backup file size
- **Error Handling**: Graceful error messages

#### Linux/macOS Usage:
```bash
# Make executable
chmod +x server/scripts/backup.sh

# Manual backup
./server/scripts/backup.sh

# Schedule daily backup (crontab)
0 2 * * * /path/to/server/scripts/backup.sh
```

#### Windows Usage:
```batch
# Manual backup
server\scripts\backup.bat

# Schedule with Task Scheduler
# Create scheduled task pointing to backup.bat
```

#### Migration Script:
```bash
# Run migrations
node server/scripts/migrate.js

# Handles:
# - Adding role column to users
# - Adding user tracking fields
# - Creating refresh_tokens table
# - Creating audit_logs table
# - Creating migrations tracking table
# - Graceful handling of existing columns
```

#### Restore Procedure:
```bash
# Stop the server
npm stop

# Copy backup to database file
cp backups/pos_backup_2024-01-15_02-00-00.db pos.db

# Restart server
npm start
```

---

### ✅ 9. Environment-Specific Configurations

#### Configuration Levels:
1. **Default Values** (`server/config/constants.js`)
2. **Environment Variables** (`.env` file)
3. **Environment-Specific** (via NODE_ENV)

#### Supported Environments:
- `development` - Full debugging, lenient limits
- `staging` - Production-like with debug logging
- `production` - Maximum security, minimal logging

#### Configuration by Environment:

**Development**:
```env
NODE_ENV=development
DEBUG=true
JWT_EXPIRY=24h
LOG_LEVEL=debug
RATE_LIMIT_ENABLED=false
```

**Staging**:
```env
NODE_ENV=staging
DEBUG=false
JWT_EXPIRY=15m
LOG_LEVEL=info
RATE_LIMIT_ENABLED=true
```

**Production**:
```env
NODE_ENV=production
DEBUG=false
JWT_EXPIRY=15m
LOG_LEVEL=warn
RATE_LIMIT_ENABLED=true
HTTPS_ONLY=true
```

#### Configuration Validation:
- Required variables checked on startup
- Graceful exit if configuration is invalid
- Detailed error messages for missing config
- Environment variable type validation

---

### ✅ 10. Authentication Flow Updates

#### Login Flow:
```
POST /api/auth/login
  ↓
Validate credentials
  ↓
Generate access token (15m)
Generate refresh token (7d)
Store refresh token in DB
Update lastLoginAt
Log audit event
  ↓
Response: { accessToken, refreshToken, user }
```

#### Refresh Token Flow:
```
POST /api/auth/refresh
  ↓
Verify refresh token
  ↓
Revoke old token
Generate new access token
Generate new refresh token
Store new refresh token
  ↓
Response: { accessToken, refreshToken }
```

#### Logout Flow:
```
POST /api/auth/logout
  ↓
Revoke specific refresh token
Log audit event
  ↓
Response: { success: true }
```

#### Logout All Devices Flow:
```
POST /api/auth/logout-all
  ↓
Revoke ALL refresh tokens for user
Log audit event
  ↓
Response: { success: true }
```

---

## Files Created (Phase 2)

### Middleware (5 files)
1. `server/middleware/rateLimiter.js` - Rate limiting
2. `server/middleware/rbacMiddleware.js` - Role-based access control
3. `server/middleware/requestLogger.js` - Request/response logging
4. `server/middleware/auditMiddleware.js` - Audit trail logging

### Configuration (1 file)
1. `server/config/logger.js` - Winston logging configuration

### Utilities (1 file)
1. `server/utils/refreshTokenManager.js` - Refresh token management

### Controllers (2 files)
1. `server/controllers/auditController.js` - Audit log endpoints
2. `server/controllers/adminController.js` - User management endpoints

### Routes (2 files)
1. `server/routes/audit.js` - Audit log routes
2. `server/routes/admin.js` - Admin management routes

### Scripts (3 files)
1. `server/scripts/backup.sh` - Linux/macOS backup script
2. `server/scripts/backup.bat` - Windows backup script
3. `server/scripts/migrate.js` - Database migration script

### Docker (3 files)
1. `server/Dockerfile` - Backend container
2. `client/Dockerfile` - Frontend container
3. `docker-compose.yml` - Multi-container orchestration
4. `server/.dockerignore` - Docker build exclusions

### Documentation (1 file - this file)
1. `PHASE_2_IMPROVEMENTS.md` - Phase 2 documentation

---

## Files Updated

### Core Files (2)
1. `server/index.js` - Integrated new middleware and routes
2. `server/config/db.js` - Added migration support for new columns
3. `server/package.json` - Added dependencies (express-rate-limit, winston, winston-daily-rotate-file)

### Auth (2)
1. `server/controllers/authController.js` - Added refresh token support
2. `server/routes/auth.js` - Added new auth endpoints

---

## Setup Instructions

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Run Database Migration
```bash
node scripts/migrate.js
```

This creates the new tables:
- `refresh_tokens` - For refresh token storage
- `audit_logs` - For audit trail
- Updates users table with: role, isActive, lastLoginAt

### 3. Configure Environment
```bash
# Copy and update .env file
cp .env.example .env

# Required variables:
JWT_SECRET=your-32-character-secret-key-here
PAYSTACK_SECRET_KEY=sk_...
PAYSTACK_PUBLIC_KEY=pk_...
NODE_ENV=production
```

### 4. Test New Features
```bash
# Test rate limiting (should fail after 5 attempts in 15 min)
for i in {1..10}; do
  curl -X POST http://localhost:3003/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done

# Test refresh token endpoint
curl -X POST http://localhost:3003/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"your-refresh-token-here"}'

# Test admin endpoints
curl http://localhost:3003/api/admin/users \
  -H "x-auth-token: your-admin-token-here"

# Test audit logs
curl http://localhost:3003/api/audit/logs \
  -H "x-auth-token: your-admin-token-here"

# Check logs
tail -f server/logs/app-*.log
```

---

## Docker Deployment

### Quick Start
```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment
```bash
# Create .env file with production values
cp server/.env.example server/.env
# Edit with production values: JWT_SECRET, API keys, etc.

# Build images
docker-compose build

# Start services in production
docker-compose up -d

# Verify health
curl http://localhost:3003/health
curl http://localhost:5173
```

---

## Security Considerations

### ✅ Implemented:
- Rate limiting on auth endpoints (5 attempts/15min)
- Refresh tokens with expiration and rotation
- Audit trail of all operations
- Role-based access control
- IP and user-agent tracking
- Password hashing (bcrypt)
- JWT token validation
- Helmet security headers
- CORS restrictions
- Input validation (Joi)

### 📋 Recommended Additional:
- HTTPS/TLS encryption (set up reverse proxy with nginx/Apache)
- Database encryption at rest
- Backup encryption
- API key management for external services
- 2FA implementation
- Advanced threat detection
- Regular security audits
- Dependency vulnerability scanning

---

## Monitoring & Maintenance

### Daily Tasks:
- Check application logs: `logs/app-*.log`
- Monitor error logs: `logs/error-*.log`
- Verify backup completion: `backups/` directory

### Weekly Tasks:
- Review audit logs for suspicious activity
- Check user login patterns in `lastLoginAt`
- Verify refresh token cleanup is working

### Monthly Tasks:
- Backup review and rotation
- Log file cleanup (old logs archived/deleted)
- Performance metrics review
- Security update check

### Backup Verification:
```bash
# List recent backups
ls -lh backups/ | tail -10

# Test restore (on dev environment)
cp pos.db pos.db.bak
cp backups/pos_backup_YYYY-MM-DD_HH-MM-SS.db pos.db
npm start  # Test if database works
```

---

## Performance Metrics

### Expected Performance:
- **Request Latency**: < 100ms (average)
- **Throughput**: 100+ requests/second
- **Database Queries**: < 50ms average
- **Log File Size**: ~1-5MB per day (depends on activity)
- **Backup Time**: < 1 second (SQLite)

### Monitoring:
- Response times logged in `logs/requests-*.log`
- Slow queries logged in `logs/app-*.log`
- Error rates logged in `logs/error-*.log`

---

## Troubleshooting

### Rate Limiting Issues:
```bash
# Check current rate limit config
grep -A5 "authLimiter" server/middleware/rateLimiter.js

# Disable rate limiting for development
export NODE_ENV=development
```

### Logging Issues:
```bash
# Check log directory permissions
ls -ld server/logs

# Check disk space
df -h server/logs

# View recent logs
tail -100 server/logs/app-*.log
```

### Refresh Token Issues:
```bash
# Check refresh token table
sqlite3 server/pos.db "SELECT COUNT(*) FROM refresh_tokens WHERE revokedAt IS NULL;"

# Clean expired tokens manually
node -e "require('./utils/refreshTokenManager').cleanupExpiredTokens()"
```

### Docker Issues:
```bash
# View container logs
docker-compose logs api

# Check container status
docker-compose ps

# Restart containers
docker-compose restart api
```

---

## Next Steps (Phase 3)

- [ ] API Documentation (Swagger/OpenAPI)
- [ ] Comprehensive test suite (Jest, Mocha)
- [ ] Performance optimization (caching, indexing)
- [ ] Advanced analytics dashboard
- [ ] Two-factor authentication (2FA)
- [ ] Multi-language support (i18n)
- [ ] Mobile app (React Native/Flutter)
- [ ] Microservices architecture
- [ ] GraphQL API
- [ ] Real-time notifications (WebSocket improvements)

---

## Support & Documentation

### Key Files to Reference:
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `PHASE_1_COMPLETE.md` - Phase 1 features
- `README.md` - Project overview
- Log files in `server/logs/` - Runtime information

### External Resources:
- [Express Rate Limit](https://github.com/nfriedly/express-rate-limit)
- [Winston Logger](https://github.com/winstonjs/winston)
- [JWT.io](https://jwt.io/) - JWT explanation
- [Docker Documentation](https://docs.docker.com/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

---

**Status**: Phase 2 In Progress ⏳
**Estimated Completion**: Ready for testing
**Ready for**: Production deployment with monitoring

