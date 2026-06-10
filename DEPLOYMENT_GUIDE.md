# POS System - Production Deployment Guide

## Phase 1: Production Readiness

This comprehensive guide documents all environment variables, configuration requirements, security settings, and deployment steps for the Beautiful Gate POS system.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Variables](#environment-variables)
3. [Server Setup](#server-setup)
4. [Client Setup](#client-setup)
5. [Security Checklist](#security-checklist)
6. [Database Setup](#database-setup)
7. [Production Deployment](#production-deployment)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Development Environment (5 minutes)

```bash
# Install server dependencies
cd server
npm install

# Create .env from example
cp .env.example .env
# Edit .env and update as needed

# Start server
npm run start

# In another terminal, install client dependencies
cd ../client
npm install

# Start client
npm run dev

# Access application
# Client: http://localhost:5173
# Server: http://localhost:3003
# Health check: http://localhost:3003/health
```

---

## Environment Variables

### Server (.env)

Create a `.env` file in the `server/` directory:

```env
# ==========================================
# Application Configuration
# ==========================================
NODE_ENV=production
PORT=3003

# ==========================================
# Database Configuration
# ==========================================
DATABASE_URL=./pos.db

# ==========================================
# JWT Authentication
# ==========================================
# Generate with: openssl rand -base64 32
# IMPORTANT: Must be at least 16 characters
JWT_SECRET=your_super_secret_jwt_key_here_min_32_characters

# ==========================================
# Paystack Payment Gateway
# ==========================================
# Get from: https://dashboard.paystack.com
# Use sk_test_ for development, sk_live_ for production
PAYSTACK_SECRET_KEY=sk_test_ffd8631aa98fd6283e54eadaacf24cde6f1be542
PAYSTACK_PUBLIC_KEY=pk_test_e5af73a9cfd63af75c2c0e4e92a56d0db1eb8ea0

# ==========================================
# CORS Configuration
# ==========================================
# Comma-separated list of allowed origins
# NO SPACES around commas
# In production, NEVER use * (wildcard)
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
```

**⚠️ SECURITY WARNING:** Never commit `.env` file to git. It's already in `.gitignore`.

### Client (.env)

Create a `.env` file in the `client/` directory:

```env
# ==========================================
# API Configuration
# ==========================================
# Development:
VITE_API_URL=http://localhost:3003

# Production:
# VITE_API_URL=https://api.yourdomain.com

# ==========================================
# Paystack Configuration
# ==========================================
# Must match server's PAYSTACK_PUBLIC_KEY
VITE_PAYSTACK_PUBLIC_KEY=pk_test_e5af73a9cfd63af75c2c0e4e92a56d0db1eb8ea0
```

### Environment Variable Reference

#### Server Variables

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `NODE_ENV` | string | Yes | `development` | `development`, `staging`, or `production` |
| `PORT` | number | Yes | `3003` | Server port |
| `DATABASE_URL` | string | No | `./pos.db` | SQLite database path |
| `JWT_SECRET` | string | Yes | - | JWT signing secret (min 16 chars) |
| `PAYSTACK_SECRET_KEY` | string | Yes | - | Paystack secret API key |
| `PAYSTACK_PUBLIC_KEY` | string | Yes | - | Paystack public API key |
| `CORS_ORIGIN` | string | No | `http://localhost:5173,http://localhost:3000` | Allowed CORS origins |

#### Client Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Backend API URL (default: `http://localhost:3003`) |
| `VITE_PAYSTACK_PUBLIC_KEY` | Yes | Paystack public key |

---

## Server Setup

### 1. Installation

```bash
cd server
npm install
```

**Dependencies:**
- `express` - Web framework
- `cors` - Cross-origin support
- `helmet` - Security headers
- `joi` - Input validation
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `sqlite3` - Database
- `socket.io` - Real-time updates
- `paystack` - Payment gateway
- `dotenv` - Environment variables

### 2. Generate Strong JWT Secret

```bash
# Generate a 32-character random string
openssl rand -base64 32

# Output example:
# rZ3x9K2mL4jN8pQ6vW1tY5sU2eO7cA9bD4

# Add to .env:
# JWT_SECRET=rZ3x9K2mL4jN8pQ6vW1tY5sU2eO7cA9bD4
```

### 3. Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit with your values
nano .env
# or
vim .env
```

Required changes:
- Set `NODE_ENV=production` for production
- Add real JWT_SECRET (min 32 chars)
- Add Paystack API keys
- Set CORS_ORIGIN to your domain

### 4. Initialize Database

The database initializes automatically on first run. Ensure the server has write permissions:

```bash
# Check directory permissions
ls -la server/

# If needed, make directory writable
chmod 755 server/
```

### 5. Running the Server

**Development:**
```bash
npm run start
# Uses nodemon for auto-reload
```

**Production:**
```bash
NODE_ENV=production npm start
```

**With PM2:**
```bash
npm install -g pm2
pm2 start index.js --name "pos-server"
pm2 logs pos-server
pm2 save
pm2 startup
```

### 6. Verify Server Health

```bash
# Health check
curl http://localhost:3003/health

# Expected response:
# {
#   "success": true,
#   "message": "Server is running",
#   "environment": "production",
#   "timestamp": "2024-01-01T12:00:00.000Z"
# }

# Test authentication endpoint
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

## Client Setup

### 1. Installation

```bash
cd client
npm install
```

### 2. Configure Environment

```bash
# Copy template
cp .env.example .env

# For development, defaults work fine
# For production, update VITE_API_URL
nano .env
```

### 3. Development

```bash
npm run dev
# Runs on http://localhost:5173
```

### 4. Production Build

```bash
# Create optimized build
npm run build

# Output location: client/dist/

# Test build locally
npm run preview
```

### 5. Deploy Built Files

```bash
# The dist/ directory contains all static files
# Upload to your hosting:

# Option 1: Vercel
npm install -g vercel
vercel --prod

# Option 2: Netlify
npm install -g netlify-cli
netlify deploy --prod --dir=dist

# Option 3: Manual (S3, GitHub Pages, etc.)
# Upload client/dist/* to your static hosting
```

---

## Security Checklist

### Before Any Deployment

- [ ] **Generate Strong JWT Secret**
  ```bash
  openssl rand -base64 32
  ```

- [ ] **Obtain Paystack API Keys**
  - Go to https://dashboard.paystack.com
  - Click Settings → API Keys
  - Copy Test keys (for staging) or Live keys (for production)

- [ ] **Configure CORS Properly**
  - List all trusted domains
  - Never use wildcard (*) in production
  - Separate multiple origins with commas

- [ ] **Set NODE_ENV to production**
  ```bash
  NODE_ENV=production
  ```

- [ ] **Enable HTTPS/SSL**
  - Use Let's Encrypt (free) or commercial certificate
  - Configure your server/proxy

- [ ] **File Permissions**
  ```bash
  # Make database readable/writable only by app
  chmod 600 server/pos.db
  chmod 755 server/
  ```

- [ ] **Verify .env Files in .gitignore**
  ```bash
  cat server/.gitignore | grep ".env"
  cat client/.gitignore | grep ".env"
  # Both should show: .env
  ```

- [ ] **Test All Authentication Flows**
  - Register new user
  - Login with valid credentials
  - Login with invalid credentials (should fail)
  - Access protected endpoint without token (should return 401)
  - Access protected endpoint with token (should work)

- [ ] **Verify Input Validation**
  - Try invalid email format (should return 400)
  - Try short password (should return 400)
  - Try empty required fields (should return 400)
  - Valid data should process successfully

- [ ] **Test Error Responses**
  - Responses should contain `success`, `message`, and `data` fields
  - No stack traces in production errors
  - User-friendly error messages

- [ ] **Verify Security Headers**
  ```bash
  curl -i http://localhost:3003/health | grep -i "x-"
  # Should see X-Content-Type-Options, X-Frame-Options, etc.
  ```

- [ ] **Test Token Refresh**
  - Verify token expiration (24 hours)
  - Test that expired tokens redirect to login

- [ ] **Review Error Messages**
  - No database paths exposed
  - No API keys revealed
  - No sensitive system information leaked

- [ ] **Firewall Configuration**
  - Only port 3003 (server) accessible from frontend
  - Database not exposed publicly
  - SSH/management ports restricted

- [ ] **Backup Strategy Tested**
  - Can backup database
  - Can restore from backup
  - Backup process automated

- [ ] **SSL Certificate Installed**
  - HTTPS is enforced
  - Certificate is valid
  - Renewal is automated

---

## Database Setup

### SQLite (Current)

**Advantages:**
- No external dependencies
- Simple to set up and backup
- Good for small to medium deployments

**Limitations:**
- Limited concurrency
- Not recommended for very high traffic
- Data in single file

### Creating Initial Data

The database schema is created automatically on first server run. Tables include:

- **users** - User accounts (email, name, hashed password)
- **products** - Product inventory (name, price, quantity)
- **sales** - Sale transactions (total, payment method, date)
- **sale_products** - Sale line items (quantity, price per item)
- **settings** - Application configuration (tax rate, etc.)

### Backup

**Manual Backup:**
```bash
# Backup database
cp server/pos.db server/pos.db.backup.$(date +%Y%m%d_%H%M%S)

# Restore backup
cp server/pos.db.backup.2024_01_01_120000 server/pos.db
```

**Automated Backup (Cron):**
```bash
# Add to crontab
crontab -e

# Backup daily at 2 AM
0 2 * * * cp /path/to/server/pos.db /path/to/backups/pos.db.$(date +\%Y\%m\%d)

# Backup weekly
0 3 * * 0 cp /path/to/server/pos.db /path/to/backups/pos.db.weekly.$(date +\%Y\%m\%d)
```

### Monitoring

```bash
# Check database size
du -h server/pos.db

# Check disk space
df -h /

# Monitor file access
lsof +D server/ | grep pos.db
```

---

## Production Deployment

### Option 1: PM2 (Node Process Manager)

**Installation:**
```bash
npm install -g pm2
```

**Start Server:**
```bash
cd server
pm2 start index.js --name "pos-server" --env production
```

**Manage:**
```bash
# View status
pm2 status

# View logs
pm2 logs pos-server

# Restart
pm2 restart pos-server

# Stop
pm2 stop pos-server

# Save startup script
pm2 save

# Auto-start on reboot
pm2 startup
```

**Configuration File (ecosystem.config.js):**
```javascript
module.exports = {
  apps: [
    {
      name: 'pos-server',
      script: './index.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
```

### Option 2: Docker

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application
COPY . .

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["node", "index.js"]
```

**Build and Run:**
```bash
# Build image
docker build -t pos-server:1.0.0 .

# Run container
docker run -d \
  -p 3003:3003 \
  --name pos-server \
  --env-file .env \
  --restart unless-stopped \
  pos-server:1.0.0

# View logs
docker logs -f pos-server

# Stop container
docker stop pos-server
```

### Option 3: Nginx Reverse Proxy

**Configuration:**
```nginx
upstream pos_server {
  server localhost:3003;
}

server {
  listen 443 ssl http2;
  server_name api.yourdomain.com;

  # SSL Certificate
  ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

  # Security headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;

  location / {
    proxy_pass http://pos_server;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
  }
}

# Redirect HTTP to HTTPS
server {
  listen 80;
  server_name api.yourdomain.com;
  return 301 https://$server_name$request_uri;
}
```

**Reload Nginx:**
```bash
sudo nginx -t  # Test config
sudo systemctl reload nginx
```

---

## Monitoring and Maintenance

### Health Checks

```bash
# Server health
curl https://api.yourdomain.com/health

# Detailed health check with timing
curl -w "@curl-format.txt" -o /dev/null -s https://api.yourdomain.com/health

# Load testing
ab -n 1000 -c 10 https://api.yourdomain.com/health
```

### Logging

**Enable Logging:**
```bash
# With PM2
pm2 start index.js --name "pos-server" \
  --output /var/log/pos-server.log \
  --error /var/log/pos-server-error.log

# Or redirect manually
node index.js >> /var/log/pos-server.log 2>&1 &
```

**View Logs:**
```bash
# Real-time
tail -f /var/log/pos-server.log

# Last 100 lines
tail -100 /var/log/pos-server.log

# Search for errors
grep "ERROR" /var/log/pos-server.log

# By date
sed -n '/2024-01-01/,/2024-01-02/p' /var/log/pos-server.log
```

### Performance Monitoring

```bash
# Monitor process
top -p $(pgrep -f "node index.js")

# Monitor database
du -h server/pos.db

# Monitor disk
df -h /

# Monitor network
netstat -tuln | grep 3003
```

### Regular Maintenance

**Weekly:**
- [ ] Review server logs for errors
- [ ] Check database size
- [ ] Verify backups completed
- [ ] Monitor disk space

**Monthly:**
- [ ] Update dependencies: `npm update`
- [ ] Audit vulnerabilities: `npm audit`
- [ ] Review error logs
- [ ] Test disaster recovery

**Quarterly:**
- [ ] Rotate JWT secret (with grace period)
- [ ] Security audit
- [ ] Performance review
- [ ] Update SSL certificates (before expiry)

### Dependency Updates

```bash
# Check for outdated packages
npm outdated

# Update all packages
npm update

# Update major versions (carefully)
npm install -g npm-check-updates
ncu -u
npm install

# Audit and fix vulnerabilities
npm audit
npm audit fix
npm audit fix --force  # Use caution
```

---

## Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Find process using port 3003
lsof -i :3003

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3004 npm start
```

**Database Locked:**
```bash
# Restart server
pm2 restart pos-server

# Or check for concurrent access
lsof server/pos.db

# Remove lock file if exists
rm server/pos.db-journal
```

**JWT Token Errors:**
```bash
# Verify JWT_SECRET is set
echo $JWT_SECRET

# Check token expiration in browser console
const token = localStorage.getItem('token');
const decoded = JSON.parse(atob(token.split('.')[1]));
console.log(new Date(decoded.exp * 1000));

# Clear and re-login
localStorage.removeItem('token');
localStorage.removeItem('user');
```

**CORS Errors:**
```bash
# Check CORS_ORIGIN is set correctly
echo $CORS_ORIGIN

# Verify client domain matches
# Update CORS_ORIGIN if needed
# Restart server
pm2 restart pos-server
```

**API Connection Failed:**
```bash
# Check server is running
curl http://localhost:3003/health

# Check firewall
sudo ufw status

# Check API URL in client
# VITE_API_URL should point to correct server
# Rebuild client if changed
npm run build
```

**Memory Leaks:**
```bash
# Monitor memory usage
watch 'ps aux | grep node'

# Generate heap dump
node --inspect=9222 index.js

# Use Chrome DevTools to analyze:
# chrome://inspect
```

---

## SSL/TLS Certificate (HTTPS)

### Using Let's Encrypt (Free)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d api.yourdomain.com

# Certificate location
# /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/api.yourdomain.com/privkey.pem

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

### Update Nginx

```nginx
ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
```

---

## Performance Optimization

### Database Indexing (Future Phase)

```sql
-- Add indexes for common queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_sales_date ON sales(createdAt);
```

### Rate Limiting (Future Phase)

```bash
npm install express-rate-limit
```

### Caching (Future Phase)

```bash
npm install redis
```

---

## Support and Resources

- **Paystack**: https://paystack.com/docs
- **Node.js**: https://nodejs.org/en/docs/
- **Express**: https://expressjs.com/
- **SQLite**: https://www.sqlite.org/
- **Joi**: https://joi.dev/
- **Helmet**: https://helmetjs.github.io/
- **PM2**: https://pm2.keymetrics.io/
- **Docker**: https://docs.docker.com/
- **Let's Encrypt**: https://letsencrypt.org/

---

## Version History

- **v1.0.0** (2024-01-01) - Initial production readiness setup
  - Authentication middleware
  - Input validation (Joi)
  - Security headers (Helmet)
  - Environment configuration
  - CORS configuration
  - Deployment guides

---

## Next Steps

1. ✅ Complete security checklist
2. ✅ Test all endpoints
3. ✅ Configure SSL/HTTPS
4. ✅ Set up monitoring
5. ✅ Create backup strategy
6. Deploy to staging environment
7. Run performance tests
8. User acceptance testing
9. Deploy to production
10. Monitor and maintain

---

*Last Updated: 2024-01-01*
*Maintained by: Development Team*
