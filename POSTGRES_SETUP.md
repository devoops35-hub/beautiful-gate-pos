# PostgreSQL Setup Guide

## Overview
The Beautiful Gate POS system has been migrated from SQLite to PostgreSQL for production-grade database support with improved concurrency, scalability, and reliability.

## Why PostgreSQL?

✅ **Better Concurrency**: Handles multiple simultaneous connections without database locks
✅ **Scalability**: Supports large datasets and high transaction volumes
✅ **Reliability**: ACID compliance, data integrity, automatic backups
✅ **Performance**: Advanced indexing, query optimization, connection pooling
✅ **Security**: Built-in authentication, encryption, role-based access control
✅ **Production Ready**: Industry standard for enterprise applications

## Prerequisites

### Windows Installation

#### Option 1: PostgreSQL Installer (Recommended)
1. Download PostgreSQL 15+ from: https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. During installation:
   - Set a password for the `postgres` superuser (remember this!)
   - Choose port 5432 (default)
   - Install pgAdmin 4 (optional, useful for GUI management)
4. After installation, PostgreSQL runs automatically as a Windows service

#### Option 2: PostgreSQL via Chocolatey (If installed)
```powershell
choco install postgresql --version 15.0
```

#### Option 3: Docker (Recommended for development)
```powershell
docker pull postgres:15-alpine
docker run -d `
  --name beautiful-gate-postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=beautiful_gate_pos `
  -p 5432:5432 `
  postgres:15-alpine
```

### Linux/Mac Installation

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

#### macOS (using Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Docker (All platforms)
```bash
docker pull postgres:15-alpine
docker run -d \
  --name beautiful-gate-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=beautiful_gate_pos \
  -p 5432:5432 \
  postgres:15-alpine
```

## Configuration

### 1. Update Environment Variables

Edit `server/.env`:

```env
# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=beautiful_gate_pos
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_SSL=false

# For production with SSL:
# DB_SSL=true
```

### 2. Create Database

#### Using psql command-line:

```bash
# Windows
psql -U postgres -c "CREATE DATABASE beautiful_gate_pos;"

# Linux/Mac
psql -U postgres -c "CREATE DATABASE beautiful_gate_pos;"
```

#### Using pgAdmin GUI:
1. Open pgAdmin 4 (usually at localhost:5050)
2. Right-click on "Databases" → Create → Database
3. Name: `beautiful_gate_pos`
4. Click "Save"

### 3. Create Database User (Optional but Recommended)

For security, create a dedicated user instead of using the `postgres` superuser:

```sql
-- Create user
CREATE USER beautiful_gate_user WITH PASSWORD 'secure_password_here';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE beautiful_gate_pos TO beautiful_gate_user;

-- Connect to the database and grant schema permissions
\c beautiful_gate_pos
GRANT ALL ON SCHEMA public TO beautiful_gate_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO beautiful_gate_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO beautiful_gate_user;
```

Then update `server/.env`:
```env
DB_USER=beautiful_gate_user
DB_PASSWORD=secure_password_here
```

## Installation

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Start the Server
```bash
npm start
```

The server will automatically:
- Create all required tables (users, products, sales, etc.)
- Create necessary indexes for performance
- Initialize default settings

### Expected Startup Output
```
✅ Connected to PostgreSQL Database
📅 Server Time: 2026-06-08T20:15:30.123Z
✅ PostgreSQL tables initialized successfully

╔════════════════════════════════════════╗
║  🚀 POS Server running on port 3003    ║
║  Environment: development              ║
║  Time: 8:15:30 PM                      ║
╚════════════════════════════════════════╝
```

## Verification

### Test Connection
```bash
# Test the health endpoint
curl http://localhost:3003/health

# Expected response:
{
  "success": true,
  "message": "Server is running",
  "environment": "development",
  "timestamp": "2026-06-08T20:15:30.123Z"
}
```

### Check Database Connection
```bash
# Connect to database
psql -U postgres -d beautiful_gate_pos

# List tables
\dt

# Expected output:
               List of relations
 Schema |       Name       | Type  | Owner
--------+------------------+-------+-----------
 public | audit_logs       | table | postgres
 public | products         | table | postgres
 public | refresh_tokens   | table | postgres
 public | sales            | table | postgres
 public | sale_products    | table | postgres
 public | settings         | table | postgres
 public | users            | table | postgres
(7 rows)
```

## Docker Compose

### Using Docker Compose for Full Stack

Create/update `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: beautiful-gate-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: beautiful_gate_pos
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  # Node.js Backend
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: beautiful-gate-server
    ports:
      - "3003:3003"
    environment:
      NODE_ENV: production
      PORT: 3003
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: beautiful_gate_pos
      DB_USER: postgres
      DB_PASSWORD: postgres
      DB_SSL: "false"
      JWT_SECRET: ${JWT_SECRET}
      PAYSTACK_SECRET_KEY: ${PAYSTACK_SECRET_KEY}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - app-network

  # React Frontend
  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: beautiful-gate-client
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3003
    depends_on:
      - server
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

### Deploy with Docker Compose
```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (warning: deletes data!)
docker-compose down -v
```

## Backup & Recovery

### Manual Backup
```bash
# Backup entire database
pg_dump -U postgres beautiful_gate_pos > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup with compression
pg_dump -U postgres beautiful_gate_pos | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Automated Backup Script (Windows - batch)
Create `backup.bat`:
```batch
@echo off
setlocal enabledelayedexpansion
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)

set BACKUP_FILE=backups\beautiful_gate_pos_!mydate!_!mytime!.sql
pg_dump -U postgres beautiful_gate_pos > %BACKUP_FILE%
echo Backup completed: %BACKUP_FILE%
```

### Restore Backup
```bash
# Restore from backup
psql -U postgres beautiful_gate_pos < backup_20260608_201530.sql

# Restore from compressed backup
gunzip -c backup_20260608_201530.sql.gz | psql -U postgres beautiful_gate_pos
```

## Performance Optimization

### Connection Pooling
The server uses a connection pool with:
- Max 20 simultaneous connections
- 30-second idle timeout
- 2-second connection timeout

### Indexes
Automatically created on:
- `users.email` (unique)
- `users.role`
- `products.name`
- `sales.created_at`
- `refresh_tokens.user_id, revoked_at`
- `audit_logs.user_id, created_at`

### Query Optimization
Use EXPLAIN ANALYZE for query performance:
```sql
EXPLAIN ANALYZE
SELECT u.id, u.name, COUNT(a.id) as action_count
FROM users u
LEFT JOIN audit_logs a ON u.id = a.user_id
GROUP BY u.id, u.name
ORDER BY action_count DESC;
```

## Troubleshooting

### "Connection refused"
- Verify PostgreSQL is running: `pg_isready`
- Check port 5432 is open
- Confirm credentials in `.env`

### "Database does not exist"
```bash
# Create database
psql -U postgres -c "CREATE DATABASE beautiful_gate_pos;"
```

### "Too many connections"
Increase PostgreSQL max connections in `postgresql.conf`:
```conf
max_connections = 100
```
Then restart PostgreSQL.

### "FATAL: password authentication failed"
- Reset password: `ALTER USER postgres WITH PASSWORD 'new_password';`
- Update `.env` file with new password
- Restart server

### Performance Issues
```sql
-- Check slow queries
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Analyze table
ANALYZE users;

-- Reindex
REINDEX TABLE users;
```

## Migration from SQLite

### Automatic Migration
The server handles schema creation automatically on first startup. No manual migration script is needed.

### Manual Data Migration (if needed)
```bash
# Export SQLite data
sqlite3 pos.db ".mode csv" ".output data.csv" "SELECT * FROM users;"

# Import to PostgreSQL
psql -U postgres beautiful_gate_pos
COPY users FROM '/path/to/data.csv' WITH (FORMAT csv);
```

## Production Considerations

### 1. Security
```env
# Use strong passwords
DB_PASSWORD=GenerateStrongRandomPassword123!

# Enable SSL in production
DB_SSL=true

# Restrict network access
POSTGRES_HOST_AUTH_METHOD=md5  # in postgresql.conf
```

### 2. Backups
- Set up automated daily backups
- Store backups off-site
- Test restore procedures regularly

### 3. Monitoring
```sql
-- Monitor active connections
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;

-- Check disk space
SELECT pg_size_pretty(pg_database_size('beautiful_gate_pos'));

-- Monitor table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 4. Maintenance
```sql
-- Vacuum and analyze (should run daily)
VACUUM ANALYZE;

-- Check integrity
REINDEX DATABASE beautiful_gate_pos;
```

## Resources

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- pgAdmin: https://www.pgadmin.org/
- Node.js pg driver: https://github.com/brianc/node-postgres
- PostgreSQL Docker: https://hub.docker.com/_/postgres

## Support

For issues or questions:
1. Check PostgreSQL logs: `SHOW log_directory;`
2. Enable query logging in PostgreSQL
3. Review application logs in `server/logs/`
4. Consult PostgreSQL documentation

---

**Status**: PostgreSQL migration complete and production-ready ✅
