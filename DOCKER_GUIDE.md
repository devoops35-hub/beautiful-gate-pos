# Docker Deployment Guide

Complete guide for deploying the Beautiful Gate POS system using Docker and Docker Compose.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Configuration](#configuration)
4. [Building Images](#building-images)
5. [Running Services](#running-services)
6. [Monitoring & Logging](#monitoring--logging)
7. [Backup & Recovery](#backup--recovery)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Minimum**:
- Docker 20.10+
- Docker Compose 1.29+
- 2GB RAM
- 5GB disk space

**Recommended for Production**:
- Docker 24.0+
- Docker Compose 2.20+
- 4GB RAM
- 20GB disk space
- Linux server (Ubuntu 22.04 LTS recommended)

### Installation

#### Windows
1. Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
2. Install and start Docker Desktop
3. Verify installation:
```bash
docker --version
docker-compose --version
```

#### macOS
1. Download [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
2. Install and start Docker Desktop
3. Verify installation:
```bash
docker --version
docker-compose --version
```

#### Linux (Ubuntu/Debian)
```bash
# Install Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Verify
docker --version
docker-compose --version

# Add current user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
```

---

## Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd pos-system
```

### 2. Create Environment File
```bash
cp server/.env.example server/.env
```

### 3. Edit Configuration
```bash
# Edit server/.env with your configuration
nano server/.env
```

### 4. Start Services
```bash
# Build and start all services in background
docker-compose up --build -d

# View status
docker-compose ps
```

### 5. Verify Services
```bash
# Check backend health
curl http://localhost:3003/health

# Check frontend
open http://localhost:5173
# or on Linux: xdg-open http://localhost:5173
```

### 6. View Logs
```bash
# View all logs
docker-compose logs

# Follow backend logs
docker-compose logs -f api

# Follow frontend logs
docker-compose logs -f web

# View last 100 lines
docker-compose logs --tail=100 api
```

---

## Configuration

### Environment Variables

Create `server/.env` with the following variables:

```env
# Server Configuration
NODE_ENV=production
PORT=3003

# JWT Configuration
JWT_SECRET=your-very-secret-key-min-32-chars-required

# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,https://yourdomain.com

# Database (usually no changes needed in Docker)
DATABASE_PATH=/app/pos.db
```

### Docker Environment Variables

These are set in `docker-compose.yml` and passed to containers:

```yaml
environment:
  - NODE_ENV=production
  - PORT=3003
  - JWT_SECRET=${JWT_SECRET}
  - PAYSTACK_SECRET_KEY=${PAYSTACK_SECRET_KEY}
  - PAYSTACK_PUBLIC_KEY=${PAYSTACK_PUBLIC_KEY}
  - CORS_ORIGIN=${CORS_ORIGIN}
```

### Volume Mounts

The Docker Compose file mounts the following volumes:

```yaml
volumes:
  - ./server/pos.db:/app/pos.db              # Database persistence
  - ./server/logs:/app/logs                  # Log files
  - ./server/backups:/app/backups            # Database backups
```

---

## Building Images

### Build All Images
```bash
# Build without using cache (fresh build)
docker-compose build --no-cache

# Build specific service
docker-compose build api
docker-compose build web
```

### Build Backend Only
```bash
cd server
docker build -t pos-api:latest .
docker build -t pos-api:v2.0 .  # Tag with version
```

### Build Frontend Only
```bash
cd client
docker build -t pos-web:latest .
docker build -t pos-web:v2.0 .  # Tag with version
```

### Push to Registry (Optional)
```bash
# Login to Docker Hub
docker login

# Tag images
docker tag pos-api:latest yourusername/pos-api:latest
docker tag pos-web:latest yourusername/pos-web:latest

# Push
docker push yourusername/pos-api:latest
docker push yourusername/pos-web:latest
```

---

## Running Services

### Start Services
```bash
# Start in background (detached mode)
docker-compose up -d

# Start in foreground (see logs)
docker-compose up

# Start with build
docker-compose up --build

# Start specific service only
docker-compose up api
docker-compose up web
```

### Stop Services
```bash
# Stop running services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove everything including volumes (WARNING: deletes data)
docker-compose down -v
```

### Restart Services
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart api

# Stop and start (cleaner restart)
docker-compose stop api && docker-compose start api
```

### View Service Status
```bash
# List running containers
docker-compose ps

# Detailed status
docker-compose ps --all

# Check service health
docker-compose exec api curl http://localhost:3003/health
```

---

## Monitoring & Logging

### View Logs

```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# Follow specific service
docker-compose logs -f api

# View last N lines
docker-compose logs --tail=50 api

# View logs from specific time
docker-compose logs --timestamps api
```

### Access Application Logs

```bash
# View logs in container
docker-compose exec api ls -la /app/logs

# View specific log file
docker-compose exec api tail -f /app/logs/app-*.log

# View error logs
docker-compose exec api tail -f /app/logs/error-*.log

# Download logs to local machine
docker cp pos-api-server:/app/logs ./logs
```

### Database Access

```bash
# Access SQLite database in container
docker-compose exec api sqlite3 /app/pos.db

# Run SQL query
docker-compose exec api sqlite3 /app/pos.db "SELECT COUNT(*) FROM users;"

# Backup database
docker-compose exec api sqlite3 /app/pos.db ".dump" > backup.sql
```

### Performance Monitoring

```bash
# View container resource usage
docker stats

# Monitor specific container
docker stats pos-api-server

# View container processes
docker-compose top api
```

### Health Checks

Docker automatically monitors service health:

```bash
# Check service health status
docker-compose ps

# Manual health check
docker-compose exec api curl -f http://localhost:3003/health || exit 1

# View health check details
docker inspect --format='{{json .State.Health}}' pos-api-server | python -m json.tool
```

---

## Backup & Recovery

### Automated Backup Script

Create `backup-docker.sh`:

```bash
#!/bin/bash

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/pos_backup_docker_$TIMESTAMP.db"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Copy database from container
docker cp pos-api-server:/app/pos.db "$BACKUP_FILE"

echo "Database backed up to: $BACKUP_FILE"

# Keep only last 7 backups
find "$BACKUP_DIR" -name "pos_backup_docker_*.db" -mtime +7 -delete

echo "Cleanup completed"
```

Usage:
```bash
chmod +x backup-docker.sh
./backup-docker.sh
```

### Manual Backup

```bash
# Backup database
docker cp pos-api-server:/app/pos.db ./backup.db

# Backup logs
docker cp pos-api-server:/app/logs ./logs-backup

# Backup everything
docker-compose exec api tar czf /tmp/backup.tar.gz /app/
docker cp pos-api-server:/tmp/backup.tar.gz ./full-backup.tar.gz
```

### Recovery Procedure

```bash
# Stop services
docker-compose stop

# Restore database
docker cp ./backup.db pos-api-server:/app/pos.db

# Restart services
docker-compose start

# Verify
docker-compose exec api sqlite3 /app/pos.db "SELECT COUNT(*) FROM users;"
```

### Volume Backup

```bash
# List volumes
docker volume ls

# Backup volume
docker run --rm \
  -v pos_api_data:/data \
  -v $(pwd):/backup \
  busybox tar czf /backup/volume-backup.tar.gz -C / data

# Restore volume
docker run --rm \
  -v pos_api_data:/data \
  -v $(pwd):/backup \
  busybox tar xzf /backup/volume-backup.tar.gz -C /
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Generate strong JWT_SECRET (32+ random characters)
- [ ] Update Paystack API keys (use live keys, not test)
- [ ] Set CORS_ORIGIN to production domain
- [ ] Set NODE_ENV=production
- [ ] Test backup/restore procedure
- [ ] Setup monitoring/alerting
- [ ] Setup log aggregation (optional)
- [ ] Configure reverse proxy (nginx/Apache)
- [ ] Setup SSL/TLS certificate
- [ ] Create non-root Docker user (recommended)
- [ ] Disable unnecessary services
- [ ] Plan capacity and scaling

### Docker Compose for Production

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  api:
    image: pos-api:v2.0
    container_name: pos-api-server
    restart: always
    environment:
      - NODE_ENV=production
      - PORT=3003
    volumes:
      - ./data/pos.db:/app/pos.db
      - ./data/logs:/app/logs
    networks:
      - pos-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3003/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  web:
    image: pos-web:v2.0
    container_name: pos-web-client
    restart: always
    environment:
      - VITE_API_URL=https://api.yourdomain.com
    networks:
      - pos-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  pos-network:
    driver: bridge
```

Start production deployment:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Nginx Reverse Proxy

Create `nginx.conf`:

```nginx
upstream api {
    server api:3003;
}

upstream web {
    server web:5173;
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    # API proxy
    location /api/ {
        proxy_pass http://api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Frontend
    location / {
        proxy_pass http://web;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Docker Network for Nginx

Update `docker-compose.prod.yml`:

```yaml
services:
  api:
    # ... existing config ...
    expose:
      - "3003"
    networks:
      - pos-network

  web:
    # ... existing config ...
    expose:
      - "5173"
    networks:
      - pos-network

  nginx:
    image: nginx:alpine
    container_name: pos-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./certs:/etc/ssl/certs
      - ./private:/etc/ssl/private
    depends_on:
      - api
      - web
    networks:
      - pos-network
```

### Auto-restart Policy

Containers automatically restart on failure:

```yaml
restart: always  # Always restart unless explicitly stopped
# OR
restart: unless-stopped  # Restart unless explicitly stopped
# OR
restart: on-failure  # Restart only on failure
restart: on-failure:5  # Max 5 restart attempts
```

### Resource Limits

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

---

## Troubleshooting

### Container Won't Start

```bash
# View detailed logs
docker-compose logs api

# Check container status
docker-compose ps

# Inspect container
docker inspect pos-api-server

# Check if port is in use
lsof -i :3003  # macOS/Linux
netstat -ano | findstr :3003  # Windows
```

### Connection Issues

```bash
# Test connectivity between containers
docker-compose exec api ping web

# Test API from within container
docker-compose exec api curl http://api:3003/health

# Check network
docker network inspect pos-system_pos-network
```

### Database Issues

```bash
# Check database file
docker-compose exec api ls -lah /app/pos.db

# Verify database integrity
docker-compose exec api sqlite3 /app/pos.db "PRAGMA integrity_check;"

# Backup before repairs
docker cp pos-api-server:/app/pos.db ./pos.db.bak

# Recover database
docker-compose exec api sqlite3 /app/pos.db "VACUUM;"
```

### Performance Issues

```bash
# Monitor resource usage
docker stats

# Check slow queries
docker-compose exec api tail -f /app/logs/app-*.log | grep -i "slow\|timeout"

# Increase container resources in docker-compose.yml
```

### Log Issues

```bash
# Check log directory
docker-compose exec api du -sh /app/logs

# Rotate logs manually
docker-compose exec api tar czf /app/logs/archive.tar.gz /app/logs/*.log

# Clean old logs
docker-compose exec api find /app/logs -mtime +30 -delete
```

### Rebuild Issues

```bash
# Clean build (remove cache)
docker-compose build --no-cache

# View build output
docker-compose build --no-cache api 2>&1 | head -50

# Inspect images
docker image ls
docker image inspect pos-api:latest
```

### Clean Up

```bash
# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Full cleanup (careful!)
docker system prune -a --volumes
```

---

## Security Best Practices

### 1. Use Secrets

Never hardcode secrets in Dockerfile or docker-compose.yml:

```bash
# Use Docker secrets (for Swarm mode)
echo "your-secret-value" | docker secret create jwt_secret -

# Reference in compose file
secrets:
  jwt_secret:
    external: true
```

### 2. Non-Root User

Update Dockerfile:

```dockerfile
RUN useradd -m -u 1000 appuser
USER appuser
```

### 3. Read-Only Filesystem

```yaml
services:
  api:
    read_only: true
    tmpfs:
      - /app/logs
      - /tmp
```

### 4. Network Isolation

```yaml
networks:
  frontend:
  backend:

services:
  api:
    networks:
      - backend
  web:
    networks:
      - frontend
      - backend
```

### 5. Regular Updates

```bash
# Update base images
docker pull node:18-alpine
docker build --no-cache .

# Scan for vulnerabilities
docker scan pos-api:latest

# Use automated scanning (if available)
# Trivy, Clair, Snyk, etc.
```

---

## Advanced Configuration

### Docker Compose Overrides

Create `docker-compose.override.yml` for development:

```yaml
version: '3.8'

services:
  api:
    environment:
      - NODE_ENV=development
      - DEBUG=true
    ports:
      - "3003:3003"
    volumes:
      - ./server:/app
```

Usage:
```bash
# Automatically includes override file
docker-compose up

# Ignore override file
docker-compose -f docker-compose.yml up
```

### Multi-Stage Builds

Already implemented in Dockerfiles for optimized images.

### Custom Networks

```yaml
networks:
  pos-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Environment File

```bash
# Create .env file
cat > .env << EOF
NODE_ENV=production
JWT_SECRET=your-secret
PAYSTACK_SECRET_KEY=sk_...
PAYSTACK_PUBLIC_KEY=pk_...
CORS_ORIGIN=https://yourdomain.com
EOF

# Reference in compose file
env_file:
  - .env
```

---

## Monitoring & Alerting

### Container Registry Monitoring

```bash
# Set up monitoring dashboard
# Visit http://localhost:5173/admin/metrics (if implemented)
```

### Log Aggregation

Setup ELK Stack or similar for production:
- Elasticsearch
- Logstash
- Kibana

### Alerting

Configure alerts for:
- Container restart failures
- Disk space warnings
- High CPU/memory usage
- Health check failures

---

## Support

For issues or questions:

1. Check Docker logs: `docker-compose logs`
2. Review this guide
3. Check `DEPLOYMENT_GUIDE.md`
4. Review application logs in `server/logs/`

---

**Last Updated**: January 2024
**Docker Version**: 24.0+
**Docker Compose Version**: 2.20+

