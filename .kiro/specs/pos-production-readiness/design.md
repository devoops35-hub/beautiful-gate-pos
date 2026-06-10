# POS System Production Readiness - Technical Design Document

## Overview

This design document provides the technical roadmap for transitioning the POS system from a development application to a production-ready platform. The system is a MERN-based Point of Sale application currently using SQLite, which will be migrated to PostgreSQL to support production workloads.

The design is organized into three phases aligned with the requirements:
- **Phase 1**: Security & Core Production Setup (Critical)
- **Phase 2**: Performance, Monitoring & Deployment (Important)
- **Phase 3**: Advanced Features & Optimization (Nice to Have)

### Current State
- **Frontend**: React 19 + Vite + Tailwind CSS + React Router
- **Backend**: Express.js 5.x + Node.js with Socket.io for real-time features
- **Database**: SQLite (to be replaced with PostgreSQL)
- **Authentication**: JWT tokens via jsonwebtoken package
- **Status**: Functional MVP with core features (products, sales, auth, dashboard)

### Target State
- Production-ready system with:
  - Robust security (environment management, input validation, rate limiting, secure headers)
  - Reliable deployment (Docker, CI/CD, health checks)
  - Performance optimization (caching, pagination, logging)
  - Operational visibility (structured logging, monitoring, error tracking)
  - Advanced capabilities (real-time updates, reporting, offline support)

---

## Architecture Overview

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  React Frontend (Vite)                                  │   │
│  │  - Pages: Login, Register, Dashboard, Inventory, Sales │   │
│  │  - Components: Cart, ProductList, Header, Sidebar      │   │
│  │  - State: AuthContext, CartContext                      │   │
│  │  - Service: axios for HTTP, Socket.io for real-time   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Service Worker (Offline Cache)                         │   │
│  │  - Asset caching strategy                               │   │
│  │  - Offline fallback UI                                  │   │
│  │  - Background sync for pending transactions             │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            │
                    HTTP/HTTPS + WebSocket
                            │
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY TIER                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Express.js Server (Port 3000)                          │   │
│  │  Middleware Stack:                                      │   │
│  │  1. CORS configuration (origin validation)              │   │
│  │  2. Rate Limiting (Redis-backed or memory)              │   │
│  │  3. Security Headers (helmet middleware)                │   │
│  │  4. Body Parser & Request Size Limit                    │   │
│  │  5. Authentication Middleware (JWT validation)          │   │
│  │  6. Request Logging (structured format)                 │   │
│  │  7. Error Handler (centralized)                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Socket.io Server (Real-time Events)                    │   │
│  │  - Namespaces: /sales, /inventory, /dashboard           │   │
│  │  - Events: sale:completed, inventory:updated            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────────────────┐ ┌──────────────┐ ┌────────────────────┐
│  DATABASE TIER    │ │  CACHE TIER  │ │  EXTERNAL SERVICES │
├───────────────────┤ ├──────────────┤ ├────────────────────┤
│  PostgreSQL DB    │ │  Redis Cache │ │  Paystack API      │
│  (Primary Store)  │ │  (Session,   │ │  CloudWatch Logs   │
│  - Connection     │ │   Products)  │ │  (Monitoring)      │
│    Pooling        │ │              │ │                    │
│  - SSL Enabled    │ │  TTL: 1-24h  │ │                    │
│  - Migrations     │ │              │ │                    │
│  - Backups        │ └──────────────┘ └────────────────────┘
└───────────────────┘
```

### Component Interaction Flow

```
User Request (HTTP)
      │
      ├─→ CORS Middleware (validate origin)
      │
      ├─→ Rate Limit Middleware (check quota)
      │   └─→ Redis (store request count)
      │
      ├─→ Request Logging (record HTTP metadata)
      │
      ├─→ Body Parser (parse JSON/form data)
      │
      ├─→ Authentication Middleware
      │   └─→ JWT Verification (check token validity)
      │
      ├─→ Input Validation Middleware (Joi/Zod schema)
      │
      ├─→ Route Handler / Controller
      │   ├─→ Service Layer (business logic)
      │   │   └─→ Repository Layer (data access)
      │   │       └─→ Database Query / Cache Lookup
      │   │           └─→ PostgreSQL / Redis
      │   │
      │   └─→ Response Formatting
      │
      ├─→ Error Handler (if exception caught)
      │   ├─→ Error Logging (structured format)
      │   └─→ Error Response (sanitized for client)
      │
      ├─→ Response Compression (gzip)
      │
      ├─→ Security Headers Middleware
      │
      └─→ HTTP Response to Client
```

### Deployment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     DOCKER COMPOSE                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Frontend Container (Node 18 / nginx)                 │   │
│  │ - Build: vite build (static assets)                  │   │
│  │ - Serve: nginx on port 80 (or 3000 for dev)         │   │
│  │ - Volumes: ./client/dist -> /app/dist               │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Backend Container (Node 18)                          │   │
│  │ - Image: node:18-alpine                              │   │
│  │ - Port: 3000 (exposed)                               │   │
│  │ - Env: .env.production                               │   │
│  │ - Volumes: node_modules cache                        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ PostgreSQL Container                                 │   │
│  │ - Image: postgres:15-alpine                          │   │
│  │ - Port: 5432 (internal only)                         │   │
│  │ - Env: POSTGRES_PASSWORD, POSTGRES_DB               │   │
│  │ - Volumes: postgres_data (named volume)              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Redis Container                                      │   │
│  │ - Image: redis:7-alpine                              │   │
│  │ - Port: 6379 (internal only)                         │   │
│  │ - Volumes: redis_data (named volume)                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  Networks: pos-network (internal service-to-service)        │
│  External: Load Balancer (nginx/haproxy for production)     │
└──────────────────────────────────────────────────────────────┘
```

---

## Database Schema Design

### PostgreSQL Schema Overview

The database schema is optimized for production with proper indexing, constraints, and relationships.

```sql
-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'cashier', -- cashier, manager, admin
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Products Table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  cost_price DECIMAL(10,2) CHECK (cost_price >= 0),
  quantity_in_stock INT NOT NULL DEFAULT 0 CHECK (quantity_in_stock >= 0),
  sku VARCHAR(100) UNIQUE,
  barcode VARCHAR(100),
  category VARCHAR(100),
  created_by INT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_is_active ON products(is_active);

-- Sales (Transactions) Table
CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  payment_method VARCHAR(50) NOT NULL, -- cash, card, online
  payment_reference VARCHAR(255), -- for online/card payments
  payment_status VARCHAR(50) DEFAULT 'completed', -- pending, completed, failed
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_payment_method ON sales(payment_method);

-- Sales Products (Line Items) Table
CREATE TABLE sales_items (
  id SERIAL PRIMARY KEY,
  sale_id INT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id),
  quantity_sold INT NOT NULL CHECK (quantity_sold > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
  line_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sales_items_sale_id ON sales_items(sale_id);
CREATE INDEX idx_sales_items_product_id ON sales_items(product_id);

-- Token Blacklist Table (for logout functionality)
CREATE TABLE token_blacklist (
  id SERIAL PRIMARY KEY,
  token VARCHAR(1000) NOT NULL,
  user_id INT NOT NULL REFERENCES users(id),
  blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_token_blacklist_token ON token_blacklist(token);
CREATE INDEX idx_token_blacklist_expires_at ON token_blacklist(expires_at);

-- Migrations Log Table (managed by Knex.js)
CREATE TABLE knex_migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  batch INT NOT NULL,
  migration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log Table (optional, for tracking sensitive actions)
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  action VARCHAR(100) NOT NULL, -- create, update, delete, login, logout
  entity_type VARCHAR(50) NOT NULL, -- users, products, sales
  entity_id INT,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
```

### Database Migrations Strategy

Migrations are managed using **Knex.js**, allowing version-controlled schema changes:

```
migrations/
├── 001_initial_schema.js        // Create base tables
├── 002_add_indexes.js           // Add performance indexes
├── 003_create_token_blacklist.js
├── 004_create_audit_logs.js
├── 005_add_sku_to_products.js   // Example: add column
└── seeds/
    ├── seed_users.js           // Initial admin user
    ├── seed_products.js        // Sample product data
    └── seed_sales.js           // Sample transaction data
```

**Migration Lifecycle:**
1. Create migration file with timestamp: `migrations/001_initial_schema.js`
2. Implement `up()` (forward) and `down()` (rollback) functions
3. Run: `npm run migrate:latest` (applies all pending)
4. Track: Knex records all executed migrations in `knex_migrations` table
5. Rollback: `npm run migrate:rollback` (undoes last batch)

**Connection Pooling Configuration:**
```javascript
const pool = {
  min: 2,        // minimum 2 connections
  max: 10,       // maximum 10 connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
// Under load, pool grows to 10; unused connections close after 30s
```

---

## PHASE 1: SECURITY & CORE PRODUCTION SETUP

### 1.1 Environment Configuration Management

#### Design Approach

Configuration is managed through a three-tier system:
1. **Environment Variables** (`.env` file) - Sensitive values, secrets
2. **Configuration Module** (`config/config.js`) - Validated and typed config object
3. **Validation Schema** (Joi) - Runtime validation ensures all required variables exist

#### Implementation Structure

**Directory Structure:**
```
server/
├── config/
│   ├── config.js           // Main config loader & validator
│   ├── environments/
│   │   ├── development.js
│   │   ├── staging.js
│   │   ├── production.js
│   │   └── test.js
│   └── validation.js       // Joi schema for environment validation
├── .env.example            // Template for .env file
├── .env.development        // Local development
├── .env.staging            // Staging environment
└── .env.production         // Production (secrets, not in repo)
```

**Environment File Structure (.env):**
```
# Application
NODE_ENV=development
APP_NAME=POS_System
APP_PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pos_dev
DB_POOL_MIN=2
DB_POOL_MAX=10

# Authentication
JWT_SECRET=your-super-secret-key-min-32-chars-long
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars-long
JWT_EXPIRY=3600
JWT_REFRESH_EXPIRY=604800

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# External Services
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx

# Logging
LOG_LEVEL=debug|info|warn|error
LOG_DIR=./logs

# Security
CORS_ORIGIN=http://localhost:5173,https://yourdomain.com
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Configuration Validation Module:**
```javascript
// config/validation.js
const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .required(),
  APP_PORT: Joi.number().required(),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  PAYSTACK_SECRET_KEY: Joi.string().required(),
  REDIS_URL: Joi.string().required(),
  // ... more fields
}).unknown(true); // Allow extra fields

module.exports = envSchema;
```

**Configuration Loader:**
```javascript
// config/config.js
const dotenv = require('dotenv');
const Joi = require('joi');
const envSchema = require('./validation');
const path = require('path');

// Load .env file for current environment
const envFile = process.env.NODE_ENV 
  ? `.env.${process.env.NODE_ENV}` 
  : '.env';
dotenv.config({ path: path.join(__dirname, `../${envFile}`) });

// Validate environment
const { error, value: config } = envSchema.validate(process.env);
if (error) {
  throw new Error(`Configuration validation failed: ${error.message}`);
}

// Export typed configuration object
module.exports = {
  app: {
    name: config.APP_NAME,
    env: config.NODE_ENV,
    port: config.APP_PORT,
  },
  database: {
    url: config.DATABASE_URL,
    pool: {
      min: config.DB_POOL_MIN,
      max: config.DB_POOL_MAX,
    },
  },
  auth: {
    jwtSecret: config.JWT_SECRET,
    jwtRefreshSecret: config.JWT_REFRESH_SECRET,
    jwtExpiry: config.JWT_EXPIRY,
  },
  redis: {
    url: config.REDIS_URL,
  },
  paystack: {
    publicKey: config.PAYSTACK_PUBLIC_KEY,
    secretKey: config.PAYSTACK_SECRET_KEY,
  },
};
```

**Sensitive Data Redaction:**
```javascript
// utils/redactSecrets.js
function redactSecrets(str) {
  const patterns = [
    /sk_live_[^\s]+/g,           // Paystack secret
    /sk_test_[^\s]+/g,           // Paystack test
    /Bearer\s+[^\s]+/g,          // JWT token
    /password[^,}]*['\"]([^'\"]+)['\"][^,}]*/gi,  // Passwords
  ];

  let result = str;
  patterns.forEach(pattern => {
    result = result.replace(pattern, (match) => {
      if (match.length <= 2) return match;
      return match[0] + '*'.repeat(match.length - 2) + match[match.length - 1];
    });
  });
  return result;
}

module.exports = { redactSecrets };
```

### 1.2 Authentication Middleware & Token Management

#### JWT Implementation

**Token Structure:**
```
Access Token (1 hour):
{
  sub: 123,                  // user id
  email: "user@example.com",
  role: "cashier",
  iat: 1700000000,          // issued at
  exp: 1700003600           // expires in 1 hour
}

Refresh Token (7 days):
{
  sub: 123,
  type: "refresh",
  iat: 1700000000,
  exp: 1700604800           // expires in 7 days
}
```

**Authentication Middleware:**
```javascript
// middleware/authenticate.js
const jwt = require('jsonwebtoken');
const { TokenBlacklist } = require('../models');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication token required',
        errorId: generateErrorId(),
      });
    }

    const token = authHeader.substring(7);

    // Check if token is blacklisted
    const isBlacklisted = await TokenBlacklist.findOne({ token });
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    // Verify token
    const decoded = jwt.verify(token, config.auth.jwtSecret);
    req.user = decoded; // Attach user to request
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token has expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid or malformed token' });
    }
    next(error);
  }
}

module.exports = authenticate;
```

**Token Issuance (on login):**
```javascript
// controllers/authController.js
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      config.auth.jwtSecret,
      { expiresIn: config.auth.jwtExpiry }
    );

    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      config.auth.jwtRefreshSecret,
      { expiresIn: '7d' }
    );

    // Update last_login
    user.last_login_at = new Date();
    await user.save();

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
}
```

**Refresh Token Flow:**
```javascript
// routes/auth.js
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.auth.jwtRefreshSecret);

    // Generate new access token
    const newAccessToken = jwt.sign(
      { sub: decoded.sub, email: decoded.email },
      config.auth.jwtSecret,
      { expiresIn: config.auth.jwtExpiry }
    );

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
```

**Logout (Token Blacklist):**
```javascript
// routes/auth.js
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const token = req.headers.authorization.substring(7);
    const decoded = jwt.decode(token);

    // Add token to blacklist
    await TokenBlacklist.create({
      token,
      user_id: req.user.sub,
      expires_at: new Date(decoded.exp * 1000),
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});
```

### 1.3 Input Validation & Sanitization

#### Validation Schema Design

**Centralized Schemas (using Joi):**
```javascript
// schemas/authSchemas.js
const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
});

module.exports = { loginSchema, registerSchema };
```

**Product Validation:**
```javascript
// schemas/productSchemas.js
const Joi = require('joi');

const createProductSchema = Joi.object({
  name: Joi.string().required().trim(),
  price: Joi.number().positive().required(),
  cost_price: Joi.number().positive().optional(),
  quantity_in_stock: Joi.number().integer().min(0).required(),
  category: Joi.string().optional(),
  description: Joi.string().max(1000).optional(),
});

module.exports = { createProductSchema };
```

**Validation Middleware:**
```javascript
// middleware/validate.js
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message,
        })),
        errorId: generateErrorId(),
      });
    }

    req.validatedData = value;
    next();
  };
}

module.exports = validate;
```

**Usage in Routes:**
```javascript
// routes/products.js
const { createProductSchema } = require('../schemas/productSchemas');
const validate = require('../middleware/validate');

router.post('/', authenticate, validate(createProductSchema), async (req, res, next) => {
  try {
    const product = await Product.create({
      ...req.validatedData,
      created_by: req.user.sub,
    });
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});
```

**SQL Injection Prevention:**
- Parameterized Queries (built-in to Knex.js): `db('users').where('email', email)` - email is parameterized
- Never use string concatenation: ❌ `db.raw('SELECT * FROM users WHERE email = ' + email)`
- Use prepared statements: ✅ `db.raw('SELECT * FROM users WHERE email = ?', [email])`

**XSS Prevention (Frontend):**
```javascript
// React component - escape user content
import DOMPurify from 'dompurify';

function ProductCard({ product }) {
  // React automatically escapes text content
  return (
    <div>
      <h3>{product.name}</h3> {/* Safe - auto-escaped */}
      {/* For HTML content, use DOMPurify */}
      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }} />
    </div>
  );
}
```

### 1.4 Rate Limiting & Security Headers

#### Rate Limiting Configuration

**Using express-rate-limit with Redis:**
```javascript
// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const redisClient = redis.createClient({
  host: config.redis.host,
  port: config.redis.port,
});

const generalLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true, // Return info in RateLimit-* headers
  legacyHeaders: false,
  message: 'Too many requests, please try again later',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: req.rateLimit.resetTime,
      errorId: generateErrorId(),
    });
  },
});

const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'auth-limit:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // Strict: 5 login attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful logins
  message: 'Too many login attempts, please try again later',
});

module.exports = { generalLimiter, authLimiter };
```

**Application Setup:**
```javascript
// index.js
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');

app.use('/api/', generalLimiter); // General rate limit on all API routes
app.use('/api/auth/login', authLimiter); // Strict limit on login
```

**Fallback (In-Memory if Redis unavailable):**
```javascript
// Use standard rate-limit with memory store as fallback
const basicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  // No store specified = uses memory (fine for single-server setups)
});
```

#### Security Headers

**Using helmet middleware:**
```javascript
// index.js
const helmet = require('helmet');

app.use(helmet());

// Custom header configuration
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline for development
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
  },
}));

app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
```

**Headers Added:**
```
X-Content-Type-Options: nosniff           // Prevent MIME type sniffing
X-Frame-Options: DENY                      // Prevent clickjacking
X-XSS-Protection: 1; mode=block           // Enable XSS filter
Strict-Transport-Security: max-age=31536000  // HSTS (production only)
Content-Security-Policy: [directives]     // Control resource loading
Referrer-Policy: no-referrer               // Don't send referrer header
```

### 1.5 Centralized Error Handling

#### Custom Error Classes

```javascript
// errors/AppError.js
class AppError extends Error {
  constructor(message, statusCode, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errorId = generateErrorId();
    this.timestamp = new Date().toISOString();
  }
}

class ValidationError extends AppError {
  constructor(message, details) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTH_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
  }
}

class ResourceNotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ResourceNotFoundError,
};
```

#### Error Handler Middleware

```javascript
// middleware/errorHandler.js
const logger = require('../config/logger');
const { redactSecrets } = require('../utils/redactSecrets');

function errorHandler(err, req, res, next) {
  const {
    statusCode = 500,
    message,
    errorId,
    errorCode = 'INTERNAL_ERROR',
  } = err;

  // Log error with full details (internally)
  const errorLog = {
    errorId,
    errorCode,
    statusCode,
    message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.sub,
    timestamp: new Date().toISOString(),
    ip: req.ip,
  };

  // Redact sensitive information
  const sanitizedLog = JSON.stringify(errorLog);
  const redactedLog = redactSecrets(sanitizedLog);

  if (statusCode >= 500) {
    logger.error(redactedLog);
  } else if (statusCode >= 400) {
    logger.warn(redactedLog);
  }

  // Send sanitized response to client
  res.status(statusCode).json({
    error: message,
    errorId, // For user reference ("Report error ID: xyz123")
    ...(process.env.NODE_ENV === 'development' && { details: err.details }),
  });
}

module.exports = errorHandler;
```

**Register error handler (last middleware):**
```javascript
// index.js
app.use(errorHandler);
```

### 1.6 Secure Credential Management

#### Credential Storage & Rotation

**Never in Source Code:**
```javascript
// ❌ WRONG - DO NOT DO THIS
const PAYSTACK_KEY = 'sk_live_xxxxxxxxxxxxx';

// ✅ CORRECT - Use environment variables
const PAYSTACK_KEY = process.env.PAYSTACK_SECRET_KEY;
```

**Credential Redaction in Logs:**
```javascript
// utils/redactSecrets.js
function redactSecrets(message) {
  const secretPatterns = [
    { pattern: /(sk_live|sk_test)_\w+/g, name: 'Paystack' },
    { pattern: /Bearer\s+\w+/g, name: 'JWT' },
    { pattern: /password["\s:]+([^",\s}]+)/gi, name: 'Password' },
  ];

  let result = message;
  secretPatterns.forEach(({ pattern }) => {
    result = result.replace(pattern, (match) => {
      const start = match.substring(0, 3);
      const end = match.substring(match.length - 4);
      return `${start}...${end}`;
    });
  });

  return result;
}
```

**Credential Rotation Without Deployment:**
```
Current Production Setup:
1. Old API key in environment: PAYSTACK_SECRET_KEY=sk_live_old_key
2. New key generated/rotated with Paystack
3. Update in hosting platform (AWS Systems Manager, Heroku Config Vars, etc.)
4. Application reloads environment on next restart (no code deployment needed)
5. New key is now active: PAYSTACK_SECRET_KEY=sk_live_new_key
```

---

## PHASE 2: PERFORMANCE, MONITORING & DEPLOYMENT

### 2.1 API Documentation with Swagger/OpenAPI

#### Swagger Setup

**Installation:**
```bash
npm install swagger-jsdoc swagger-ui-express
```

**Configuration:**
```javascript
// config/swagger.js
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'POS System API',
      version: '1.0.0',
      description: 'Point of Sale System API Documentation',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.yourdomain.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'], // Path to route files
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
```

**Register Swagger UI:**
```javascript
// index.js
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

#### Endpoint Documentation

**Example Route Documentation:**
```javascript
// routes/auth.js

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *             required: [email, password]
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many login attempts
 */
router.post('/login', authLimiter, validate(loginSchema), login);
```

### 2.2 Caching Layer with Redis

#### Cache Strategy

**Redis Connection:**
```javascript
// config/redis.js
const redis = require('redis');
const config = require('./config');

const redisClient = redis.createClient({
  url: config.redis.url,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        return new Error('Max retries reached');
      }
      return retries * 100;
    },
  },
});

redisClient.on('error', (err) => logger.error('Redis error:', err));
redisClient.on('connect', () => logger.info('Redis connected'));

await redisClient.connect();

module.exports = redisClient;
```

**Cache Service Layer:**
```javascript
// services/cacheService.js
const redisClient = require('../config/redis');
const logger = require('../config/logger');

class CacheService {
  async get(key) {
    try {
      const cached = await redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.warn(`Cache get error for ${key}:`, error);
      return null; // Fail gracefully, fetch from DB
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.warn(`Cache set error for ${key}:`, error);
      // Don't fail the request if caching fails
    }
  }

  async invalidate(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      logger.warn(`Cache invalidation error:`, error);
    }
  }
}

module.exports = new CacheService();
```

**Cache Implementation in Service:**
```javascript
// services/productService.js
const cacheService = require('./cacheService');

class ProductService {
  async getAll(options = {}) {
    const cacheKey = `products:all:${JSON.stringify(options)}`;
    
    // Try cache first
    let products = await cacheService.get(cacheKey);
    if (products) {
      return products; // Cache hit
    }

    // Cache miss - fetch from database
    products = await Product.findAll(options);
    
    // Store in cache for 1 hour
    await cacheService.set(cacheKey, products, 3600);
    
    return products;
  }

  async create(data) {
    const product = await Product.create(data);
    
    // Invalidate products list cache
    await cacheService.invalidate('products:*');
    
    return product;
  }

  async update(id, data) {
    const product = await Product.update(id, data);
    
    // Invalidate specific product and list caches
    await cacheService.invalidate(`product:${id}:*`);
    await cacheService.invalidate('products:*');
    
    return product;
  }
}

module.exports = new ProductService();
```

**Cache Invalidation Patterns:**
```
Pattern: key:namespace:identifier

Examples:
- products:all:filters         // All products list
- product:123:*                // Product 123 (any variant)
- sales:user:45:*              // User 45's sales
- stats:dashboard:*            // Dashboard statistics
```

### 2.3 Response Pagination

#### Pagination Implementation

**Query Helper:**
```javascript
// utils/pagination.js
function getPaginationParams(query) {
  let { page = 1, limit = 50, offset = 0 } = query;

  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit) || 50));
  offset = (page - 1) * limit;

  return { page, limit, offset };
}

function getPaginationMetadata(totalCount, limit, page) {
  const totalPages = Math.ceil(totalCount / limit);

  return {
    currentPage: page,
    pageSize: limit,
    totalItems: totalCount,
    totalPages,
    hasMore: page < totalPages,
    nextPage: page < totalPages ? page + 1 : null,
    previousPage: page > 1 ? page - 1 : null,
  };
}

module.exports = { getPaginationParams, getPaginationMetadata };
```

**Controller Usage:**
```javascript
// controllers/productController.js
const { getPaginationParams, getPaginationMetadata } = require('../utils/pagination');

async function getAllProducts(req, res, next) {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);

    const { rows: products, count: total } = await Product.findAndCountAll({
      offset,
      limit,
      where: { is_active: true },
    });

    const metadata = getPaginationMetadata(total, limit, page);

    res.json({
      data: products,
      pagination: metadata,
    });
  } catch (error) {
    next(error);
  }
}
```

**Response Format:**
```json
{
  "data": [
    { "id": 1, "name": "Product A", "price": 29.99 },
    { "id": 2, "name": "Product B", "price": 49.99 }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 50,
    "totalItems": 250,
    "totalPages": 5,
    "hasMore": true,
    "nextPage": 2,
    "previousPage": null
  }
}
```

### 2.4 Logging & Monitoring Setup

#### Logging Configuration

**Using Winston logger:**
```javascript
// config/logger.js
const winston = require('winston');
const path = require('path');
const config = require('./config');

const logger = winston.createLogger({
  level: config.logging.level || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta,
      });
    })
  ),
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(config.logging.dir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // All logs
    new winston.transports.File({
      filename: path.join(config.logging.dir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Console (development)
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

module.exports = logger;
```

**Request Logging Middleware:**
```javascript
// middleware/requestLogger.js
const logger = require('../config/logger');

function requestLogger(req, res, next) {
  const start = Date.now();

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.sub,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    return originalSend.call(this, data);
  };

  next();
}

module.exports = requestLogger;
```

**Application Setup:**
```javascript
// index.js
const requestLogger = require('./middleware/requestLogger');

app.use(requestLogger);
```

#### Log Levels & Examples

```
ERROR:  logger.error('Database connection failed', { error, code })
WARN:   logger.warn('Rate limit approaching', { userId, requestCount })
INFO:   logger.info('User logged in', { userId, email })
DEBUG:  logger.debug('Cache hit', { key, duration })

Daily rotation with 5 files max, 5MB each per log file
```

### 2.5 Docker Containerization

#### Dockerfile for Backend

```dockerfile
# server/Dockerfile.prod
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "index.js"]
```

#### Dockerfile for Frontend

```dockerfile
# client/Dockerfile.prod
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - pos-network
    environment:
      - REACT_APP_API_URL=http://backend:3000

  backend:
    build:
      context: ./server
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    networks:
      - pos-network
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://pos_user:pos_password@postgres:5432/pos_db
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      PAYSTACK_SECRET_KEY: ${PAYSTACK_SECRET_KEY}
    volumes:
      - ./server/logs:/app/logs
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    networks:
      - pos-network
    environment:
      POSTGRES_USER: pos_user
      POSTGRES_PASSWORD: pos_password
      POSTGRES_DB: pos_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - pos-network
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  pos-network:
    driver: bridge
```

**Build and Run:**
```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down

# Reset volumes (clean slate)
docker-compose down -v
```

### 2.6 Health Check Endpoints

#### Health Check Controller

```javascript
// controllers/healthController.js
const redisClient = require('../config/redis');
const db = require('../config/database');

async function getHealth(req, res) {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
}

async function getDetailedHealth(req, res) {
  const health = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'unknown',
      redis: 'unknown',
      paystack: 'unknown',
    },
  };

  try {
    // Check database
    await db.query('SELECT 1');
    health.services.database = 'healthy';
  } catch (error) {
    health.services.database = 'unhealthy';
  }

  try {
    // Check Redis
    await redisClient.ping();
    health.services.redis = 'healthy';
  } catch (error) {
    health.services.redis = 'unhealthy';
  }

  // Paystack is optional - check only if configured
  if (process.env.PAYSTACK_SECRET_KEY) {
    try {
      // Try fetching balance to verify credentials
      const response = await fetch('https://api.paystack.co/balance', {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      });
      health.services.paystack = response.ok ? 'healthy' : 'unhealthy';
    } catch (error) {
      health.services.paystack = 'unhealthy';
    }
  } else {
    health.services.paystack = 'unconfigured';
  }

  const overallHealth = Object.values(health.services)
    .every(s => s === 'healthy' || s === 'unconfigured') ? 200 : 503;

  res.status(overallHealth).json(health);
}

module.exports = { getHealth, getDetailedHealth };
```

#### Routes

```javascript
// routes/health.js
const express = require('express');
const { getHealth, getDetailedHealth } = require('../controllers/healthController');

const router = express.Router();

router.get('/health', getHealth);
router.get('/health/detailed', getDetailedHealth);

module.exports = router;
```

### 2.7 Testing Framework

#### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: './coverage',
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'models/**/*.js',
    '!node_modules/**',
  ],
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};
```

#### Test Database Setup

```javascript
// tests/setup.js
const db = require('../config/database');

beforeAll(async () => {
  // Run migrations on test database
  await db.migrate.latest();
  // Seed test data if needed
  await db.seed.run();
});

afterEach(async () => {
  // Clear tables after each test
  const tables = ['sales_items', 'sales', 'products', 'users'];
  for (const table of tables) {
    await db(table).delete();
  }
});

afterAll(async () => {
  // Close database connection
  await db.destroy();
});
```

#### Example Tests

```javascript
// tests/controllers/auth.test.js
const request = require('supertest');
const app = require('../../index');
const User = require('../../models/User');

describe('Authentication Controller', () => {
  describe('POST /api/auth/login', () => {
    it('should return 200 and tokens for valid credentials', async () => {
      // Setup
      const user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      });

      // Test
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
});
```

**Run Tests:**
```bash
npm run test                    # Run all tests
npm run test -- --coverage     # Generate coverage report
npm run test -- --watch       # Watch mode
```

---

## PHASE 3: ADVANCED FEATURES & OPTIMIZATION

### 3.1 Real-time Features with Socket.io

#### Socket.io Configuration

**Server Setup:**
```javascript
// config/socket.js
const { Server } = require('socket.io');

function configureSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      methods: ['GET', 'POST'],
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    try {
      const decoded = jwt.verify(token, config.auth.jwtSecret);
      socket.userId = decoded.sub;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  return io;
}

module.exports = { configureSocket };
```

**Event Handlers:**
```javascript
// events/saleEvents.js
function registerSaleEvents(io) {
  io.of('/sales').on('connection', (socket) => {
    console.log(`User ${socket.userId} connected to sales namespace`);

    socket.on('sale:complete', (saleData) => {
      // Broadcast to all connected clients
      io.of('/sales').emit('sale:completed', {
        saleId: saleData.id,
        totalAmount: saleData.total_amount,
        timestamp: new Date(),
        items: saleData.items,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });
}

module.exports = { registerSaleEvents };
```

**Emit from Business Logic:**
```javascript
// services/salesService.js
async function completeSale(saleData, io) {
  const sale = await Sales.create(saleData);
  
  // Emit to all connected clients
  io.of('/sales').emit('sale:completed', {
    id: sale.id,
    total_amount: sale.total_amount,
    timestamp: sale.created_at,
  });

  return sale;
}
```

**Frontend Integration (React):**
```javascript
// hooks/useSocket.js
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export function useSocket(namespace = '/') {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const newSocket = io(`${import.meta.env.VITE_API_URL}${namespace}`, {
      auth: { token },
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [namespace]);

  return socket;
}

// Usage in component
function SalesDashboard() {
  const socket = useSocket('/sales');
  const [sales, setSales] = useState([]);

  useEffect(() => {
    if (!socket) return;

    socket.on('sale:completed', (saleData) => {
      setSales(prev => [saleData, ...prev]);
    });

    return () => socket.off('sale:completed');
  }, [socket]);

  return <div>{/* Display sales */}</div>;
}
```

### 3.2 Advanced Reporting Engine

#### Report Generation Service

```javascript
// services/reportingService.js
class ReportingService {
  async generateSalesReport(startDate, endDate, filters = {}) {
    const sales = await Sales.query()
      .where('created_at', '>=', startDate)
      .where('created_at', '<=', endDate)
      .where((builder) => {
        if (filters.paymentMethod) {
          builder.where('payment_method', filters.paymentMethod);
        }
      });

    const totalRevenue = sales.reduce((sum, s) => sum + s.total_amount, 0);
    const avgTransaction = sales.length ? totalRevenue / sales.length : 0;

    return {
      dateRange: { startDate, endDate },
      totalRevenue,
      transactionCount: sales.length,
      avgTransaction,
      paymentBreakdown: this.getPaymentBreakdown(sales),
      topProducts: await this.getTopProducts(sales),
    };
  }

  getPaymentBreakdown(sales) {
    return {
      cash: sales
        .filter(s => s.payment_method === 'cash')
        .reduce((sum, s) => sum + s.total_amount, 0),
      card: sales
        .filter(s => s.payment_method === 'card')
        .reduce((sum, s) => sum + s.total_amount, 0),
      online: sales
        .filter(s => s.payment_method === 'online')
        .reduce((sum, s) => sum + s.total_amount, 0),
    };
  }

  async getTopProducts(sales) {
    const saleIds = sales.map(s => s.id);
    return await SalesItem.query()
      .whereIn('sale_id', saleIds)
      .groupBy('product_id')
      .select('product_id')
      .count('* as quantity_sold')
      .sum('line_total as revenue')
      .orderBy('quantity_sold', 'desc')
      .limit(10);
  }
}

module.exports = new ReportingService();
```

#### Report Export

```javascript
// services/exportService.js
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

async function exportReportAsCSV(report, filePath) {
  // Create CSV
}

async function exportReportAsPDF(report, filePath) {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).text('Sales Report');
  doc.fontSize(12).text(`Total Revenue: $${report.totalRevenue}`);
  // ... more content

  doc.end();
}
```

### 3.3 Frontend Service Worker

#### Service Worker Registration

```javascript
// src/serviceWorker.js
function registerServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('SW registered:', registration);
        })
        .catch(error => {
          console.error('SW registration failed:', error);
        });
    });
  }
}

export { registerServiceWorker };
```

#### Service Worker Implementation

```javascript
// public/service-worker.js
const CACHE_NAME = 'pos-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/js/main.js',
  // Add critical assets
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response; // Cache hit
      }

      return fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Cache successful responses
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Offline fallback
          return caches.match('/offline.html');
        });
    })
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

### 3.4 Performance Optimization

#### Frontend Code Splitting

```javascript
// src/App.jsx - Using React.lazy for route-based splitting
import { Suspense, lazy } from 'react';

const Dashboard = lazy(() => import('./pages/DashboardPage'));
const Inventory = lazy(() => import('./pages/InventoryPage'));
const Sales = lazy(() => import('./pages/SalesPage'));
const AdminSettings = lazy(() => import('./pages/AdminSettingsPage'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        {/* ... */}
      </Routes>
    </Suspense>
  );
}
```

#### Backend Query Optimization

```javascript
// Database indexes on frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_products_category ON products(category);

// N+1 Query prevention with eager loading
const sales = await Sales.query()
  .eager('user')          // Fetch user details in single query
  .eager('saleItems.product')
  .limit(100);
```

#### Response Compression

```javascript
// index.js
const compression = require('compression');

app.use(compression()); // Gzip compression
```

### 3.5 CI/CD Pipeline

#### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [ main, staging ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm run test -- --coverage

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/coverage-final.json

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Build Docker image
      run: docker build -t pos-backend:${{ github.sha }} .

    - name: Push to registry
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker tag pos-backend:${{ github.sha }} ${{ secrets.DOCKER_REGISTRY }}/pos-backend:latest
        docker push ${{ secrets.DOCKER_REGISTRY }}/pos-backend:latest

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to production
      run: |
        # Deployment script (e.g., ssh, kubectl, etc.)
        ./scripts/deploy.sh ${{ secrets.DEPLOY_KEY }}
```

---

## Implementation Patterns

### Middleware Stack Organization

```javascript
// index.js - Middleware registration order (critical)

// 1. Trust proxy (for load balancers)
app.set('trust proxy', 1);

// 2. Security headers
app.use(helmet());

// 3. CORS
app.use(cors(corsOptions));

// 4. Body parser
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ limit: '100kb' }));

// 5. Request logging
app.use(requestLogger);

// 6. Rate limiting (should be early)
app.use('/api/', rateLimiter);

// 7. Authentication (checks token)
app.use('/api/', authenticate);

// 8. Request ID generation
app.use((req, res, next) => {
  req.id = generateRequestId();
  next();
});

// 9. Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
// ...

// 10. 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// 11. Error handler (LAST)
app.use(errorHandler);
```

### Service Layer Pattern

```
Request Flow:
  Route Handler
    → Controller (parse req, call service)
      → Service (business logic)
        → Repository (data access)
          → Database/Cache
        ← Return domain objects
      ← Return DTOs
    ← Return HTTP response
```

**Example Structure:**
```javascript
// controllers/productController.js
async function create(req, res, next) {
  try {
    const product = await productService.create(req.validatedData);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
}

// services/productService.js
async function create(data) {
  // Validate business rules
  if (data.price < data.cost_price) {
    throw new ValidationError('Price must be higher than cost');
  }

  // Call repository
  return await productRepository.create(data);
}

// repositories/productRepository.js
async function create(data) {
  return await db('products').insert(data).returning('*');
}
```

### Error Handling Flow

```javascript
// Route throws error
throw new ValidationError('Invalid email', { field: 'email' });

// Caught by express
// (any throw/async error caught automatically)

// Error handler middleware
errorHandler(err, req, res, next) {
  logger.error({
    errorId: err.errorId,
    message: err.message,
    stack: err.stack,
  });

  res.status(err.statusCode).json({
    error: err.message,
    errorId: err.errorId,
  });
}
```

---

## Directory Structure

```
project-root/
├── client/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── context/          # React context (auth, cart)
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # API client services
│   │   ├── utils/            # Helper functions
│   │   ├── App.jsx           # Main app component
│   │   └── main.jsx          # Entry point
│   ├── public/
│   │   └── service-worker.js # PWA service worker
│   ├── Dockerfile.prod       # Production image
│   ├── vite.config.js
│   └── package.json
│
├── server/
│   ├── config/
│   │   ├── config.js         # Configuration loader
│   │   ├── validation.js     # Env validation schema
│   │   ├── database.js       # DB connection & pool
│   │   ├── logger.js         # Winston logger
│   │   ├── redis.js          # Redis client
│   │   ├── socket.js         # Socket.io setup
│   │   └── swagger.js        # Swagger configuration
│   │
│   ├── migrations/           # Knex.js migrations
│   │   ├── 001_initial_schema.js
│   │   └── seeds/
│   │
│   ├── models/               # Database models
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Sale.js
│   │   └── TokenBlacklist.js
│   │
│   ├── repositories/         # Data access layer
│   │   ├── userRepository.js
│   │   ├── productRepository.js
│   │   └── saleRepository.js
│   │
│   ├── services/             # Business logic layer
│   │   ├── authService.js
│   │   ├── productService.js
│   │   ├── salesService.js
│   │   ├── cacheService.js
│   │   └── reportingService.js
│   │
│   ├── controllers/          # Request handlers
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── salesController.js
│   │   └── healthController.js
│   │
│   ├── routes/               # API routes
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── sales.js
│   │   ├── health.js
│   │   └── index.js (routes aggregator)
│   │
│   ├── schemas/              # Validation schemas
│   │   ├── authSchemas.js
│   │   └── productSchemas.js
│   │
│   ├── middleware/
│   │   ├── authenticate.js
│   │   ├── authorize.js
│   │   ├── validate.js
│   │   ├── errorHandler.js
│   │   ├── requestLogger.js
│   │   └── rateLimiter.js
│   │
│   ├── utils/
│   │   ├── redactSecrets.js
│   │   ├── pagination.js
│   │   ├── errorId.js
│   │   └── validators.js
│   │
│   ├── events/               # Socket.io event handlers
│   │   ├── saleEvents.js
│   │   └── inventoryEvents.js
│   │
│   ├── tests/                # Test files
│   │   ├── setup.js
│   │   ├── controllers/
│   │   └── services/
│   │
│   ├── Dockerfile.prod       # Production image
│   ├── index.js              # Entry point
│   ├── .env.example          # Environment template
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── deploy.yml        # CI/CD pipeline
│
├── docker-compose.yml        # Local development setup
├── docker-compose.prod.yml   # Production setup
└── README.md
```

---

## Key Design Decisions & Rationales

| Decision | Rationale | Trade-offs |
|----------|-----------|-----------|
| PostgreSQL over SQLite | Supports concurrent users, connection pooling, better performance | Requires separate service, more infrastructure |
| JWT tokens with refresh | Stateless auth, scalable, mobile-friendly | Requires token blacklist for logout |
| Redis caching | Improves performance for read-heavy operations | Additional service to manage, TTL strategy complexity |
| Docker containerization | Consistent deployment across environments | Adds complexity to local development setup |
| Service layer pattern | Separation of concerns, testability | More files and abstraction layers |
| Socket.io for real-time | Low latency, familiar to Node.js ecosystem | Stateful connections, harder to scale horizontally |
| Structured logging (JSON) | Machine-readable, searchable, aggregatable | Slightly more complex to set up initially |

---

## Integration Points

### Frontend ↔ Backend Communication

```
HTTP Endpoints:
  POST   /api/auth/login           (username + password → tokens)
  POST   /api/auth/refresh          (refresh token → new access token)
  POST   /api/auth/logout           (invalidate token)
  
  GET    /api/products              (paginated list)
  POST   /api/products              (create product)
  PUT    /api/products/:id          (update product)
  DELETE /api/products/:id          (soft delete or hard delete)
  
  POST   /api/sales                 (create transaction)
  GET    /api/sales                 (paginated sales list)
  
  GET    /api/dashboard/stats       (dashboard metrics)
  GET    /api/reports/sales         (sales report with date filtering)
  
  GET    /api/health                (system health)
  GET    /api/health/detailed       (detailed component health)

WebSocket Events:
  sale:completed                     (new sale event)
  inventory:updated                  (stock level changed)
  product:added                      (new product added)
```

### External Service Integration

**Paystack (Payment Processing):**
```javascript
// Initialize payment
POST https://api.paystack.co/transaction/initialize
Body: { email, amount, reference }
Response: { authorization_url, access_code }

// Verify payment
GET https://api.paystack.co/transaction/verify/{reference}
Response: { status, amount, customer }
```

**CloudWatch Logs (AWS):**
```javascript
// Logs are sent via winston transport
// Requires AWS SDK configuration and IAM permissions
```

---

## Security Considerations

### Authentication/Authorization Flow

```
1. User submits credentials (login)
2. Backend validates against database
3. Backend generates JWT (access + refresh)
4. Frontend stores tokens (localStorage/sessionStorage)
5. Frontend sends accessToken in Authorization header
6. Backend validates JWT on each protected request
7. If token expired, frontend uses refreshToken to get new accessToken
8. On logout, token is added to blacklist (checked before validation)
```

### Data Encryption

```
Transport:
  - HTTPS/TLS in production (enforced by HSTS header)
  - WSS (secure WebSocket) for Socket.io

Storage:
  - Passwords: bcrypt hashing (not reversible)
  - API Keys: Environment variables (never in code)
  - Sensitive Data: Consider field-level encryption in DB if needed
```

### Sensitive Data Handling

```javascript
// Don't return passwords in API responses
async function getUser(id) {
  const user = await db('users').where('id', id).first();
  delete user.password_hash; // Remove before returning
  return user;
}

// Redact credentials in logs
logger.info('Login attempt', {
  email: user.email,
  // password_hash not included
});
```

---

## Scalability Considerations

### Database Scaling

```
Connection Pooling:
  - Min: 2 connections
  - Max: 10 connections (configurable per environment)
  - Idle timeout: 30 seconds
  - Allows 10 concurrent queries per server

Read Replicas (future):
  - Primary DB for writes
  - Read replicas for SELECT queries
  - Point read queries to replicas

Indexing Strategy:
  - Index frequently queried columns (email, user_id, created_at)
  - Index foreign keys
  - Monitor slow queries with EXPLAIN ANALYZE
```

### Cache Invalidation Strategy

```
Pattern-based invalidation:
  - products:*            → invalidate on any product change
  - products:all:*        → specific query cache
  - dashboard:stats:*     → dashboard metrics

TTL Strategy:
  - Product list: 1 hour (long-lived)
  - Product details: 1 hour
  - User data: 15 minutes
  - Dashboard stats: 5 minutes
  - Session data: JWT expiry (1 hour)
```

### Rate Limiting for Scale

```
Per-endpoint limits:
  POST /api/auth/login:        5 requests / 15 min per IP
  GET /api/products:           100 requests / 15 min per user
  POST /api/sales:             50 requests / 15 min per user

Stored in Redis:
  Key: rate-limit:{endpoint}:{identifier}
  Value: request_count
  TTL: 15 minutes
```

### Load Balancing Preparation

```
Behind load balancer:
  - Stateless backend (JWT instead of sessions)
  - Horizontal scaling ready (multiple backend instances)
  - Central database (PostgreSQL)
  - Central cache (Redis)
  - Central logs (CloudWatch/ELK Stack)
```

---

## Summary

This design provides a production-ready POS system with:

✅ **Security**: Environment management, JWT auth, input validation, rate limiting, secure headers
✅ **Performance**: Redis caching, pagination, response compression, database indexing
✅ **Reliability**: Error handling, logging, health checks, database migrations
✅ **Deployability**: Docker containers, docker-compose, CI/CD pipeline
✅ **Scalability**: Connection pooling, cache strategy, stateless design
✅ **Maintainability**: Service layer pattern, structured code organization, comprehensive documentation

The phased approach allows teams to implement incrementally, starting with critical Phase 1 security features, adding Phase 2 operational capabilities, and finally implementing Phase 3 advanced features.
