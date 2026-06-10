# Project Structure

## Root Directory Layout

```
Project Root/
├── client/                        # React frontend application
├── server/                        # Express backend application
├── docker-compose.yml             # Multi-container orchestration
├── DEPLOYMENT_GUIDE.md            # Production deployment instructions
├── PHASE_2_COMPLETE.md            # Phase 2 implementation summary
├── IMPLEMENTATION_SUMMARY.md      # Phase 1 implementation details
└── Other docs (MIGRATION, SETUP, etc.)
```

## Frontend Structure (`client/`)

```
client/
├── package.json                   # Dependencies & build scripts
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS setup
├── eslint.config.js               # ESLint rules
├── index.html                     # HTML entry template
├── .env                           # Environment variables (gitignored)
├── .env.example                   # Template for .env
│
├── src/
│   ├── main.jsx                   # React entry point
│   ├── App.jsx                    # Root component
│   ├── App.css                    # Global styles
│   ├── index.css                  # Global CSS
│   │
│   ├── config/
│   │   ├── api.js                 # Axios client with interceptors
│   │   └── paystack.js            # Paystack configuration
│   │
│   ├── context/                   # React Context providers
│   │   ├── AuthContext.jsx        # Auth state & JWT management
│   │   └── CartContext.jsx        # Shopping cart state
│   │
│   ├── components/                # Reusable React components
│   │   ├── Header.jsx             # Top navigation
│   │   ├── Sidebar.jsx            # Side navigation
│   │   ├── ProductList.jsx        # Product selection UI
│   │   ├── Cart.jsx               # Shopping cart display
│   │   ├── PaymentDetails.jsx     # Payment form
│   │   ├── Sales.jsx              # Sales history
│   │   ├── ConfirmationModal.jsx  # Confirmation dialogs
│   │   └── ProtectedRoute.jsx     # Auth wrapper for routes
│   │
│   ├── pages/                     # Full-page components
│   │   ├── LoginPage.jsx          # User login
│   │   ├── RegisterPage.jsx       # User registration
│   │   ├── DashboardPage.jsx      # Analytics dashboard
│   │   └── InventoryPage.jsx      # Product management
│   │
│   ├── assets/                    # Static assets
│   │   └── react.svg
│   │
│   └── utils/                     # Utility functions (currently empty)
│
├── public/                        # Static public files
│   ├── beautiful-gate-logo.png
│   └── vite.svg
│
└── dist/                          # Build output (production)
    └── [Static files after build]
```

## Backend Structure (`server/`)

```
server/
├── package.json                   # Dependencies & scripts
├── index.js                       # Server bootstrap & middleware setup
├── .env                           # Environment variables (gitignored)
├── .env.example                   # Template for .env
├── .gitignore                     # Git ignore rules
│
├── config/                        # Configuration modules
│   ├── constants.js               # Centralized config & constants
│   ├── logger.js                  # Winston logging setup
│   ├── db.js                      # Database connection & migrations
│   ├── supabase.js                # Supabase client setup
│   └── paystack.js                # Paystack API configuration
│
├── middleware/                    # Express middleware
│   ├── authMiddleware.js          # JWT verification & auth guards
│   ├── rbacMiddleware.js          # Role-based access control
│   ├── rateLimiter.js             # Rate limiting strategies
│   ├── auditMiddleware.js         # Audit event logging
│   ├── requestLogger.js           # Request/response logging
│   └── errorHandler.js            # Error handling middleware
│
├── controllers/                   # Business logic handlers
│   ├── authController.js          # Registration, login, token refresh
│   ├── productController.js       # Product CRUD operations
│   ├── salesController.js         # Sales & payment processing
│   ├── dashboardController.js     # Analytics & statistics
│   ├── settingsController.js      # Configuration management
│   ├── adminController.js         # Admin user management
│   └── auditController.js         # Audit log retrieval & export
│
├── routes/                        # API route definitions
│   ├── auth.js                    # /api/auth endpoints
│   ├── products.js                # /api/products endpoints
│   ├── sales.js                   # /api/sales endpoints
│   ├── dashboard.js               # /api/dashboard endpoints
│   ├── settings.js                # /api/settings endpoints
│   ├── admin.js                   # /api/admin endpoints
│   └── audit.js                   # /api/audit endpoints
│
├── validations/                   # Joi validation schemas
│   ├── authValidation.js          # Login/register schemas
│   ├── productValidation.js       # Product CRUD schemas
│   ├── salesValidation.js         # Sales & payment schemas
│   └── settingsValidation.js      # Settings update schemas
│
├── utils/                         # Utility functions
│   ├── errorHandler.js            # Error formatting & helpers
│   └── refreshTokenManager.js     # Token generation & management
│
├── scripts/                       # Automation scripts
│   ├── backup.sh                  # Linux/Mac backup script
│   ├── backup.bat                 # Windows backup script
│   └── migrate.js                 # Database migration runner
│
├── logs/                          # Generated log files
│   ├── app-YYYY-MM-DD.log         # Application logs
│   ├── error-YYYY-MM-DD.log       # Error logs
│   ├── requests-YYYY-MM-DD.log    # Request/response logs
│   └── audit-YYYY-MM-DD.log       # Audit trail logs
│
├── backups/                       # Database backups
│   └── backup-YYYY-MM-DD.sql      # Automated backups
│
├── Dockerfile                     # Container image definition
├── .dockerignore                  # Files to exclude from Docker build
│
└── node_modules/                  # Dependencies (gitignored)
```

## Key Directory Purposes

### Frontend (`client/src/`)
- **components/**: Reusable UI elements (ProductList, Cart, etc.)
- **pages/**: Full-page views (Login, Dashboard, Inventory)
- **context/**: Global state management (Auth, Cart)
- **config/**: Environment & service configuration
- **utils/**: Helper functions (empty for extension)

### Backend (`server/`)
- **config/**: Application configuration & database setup
- **middleware/**: Request processing & security enforcement
- **controllers/**: Business logic & request handlers
- **routes/**: API endpoint definitions
- **validations/**: Input validation schemas (Joi)
- **utils/**: Reusable utility functions
- **scripts/**: Automation (backups, migrations)
- **logs/**: Runtime log files
- **backups/**: Database backups

## API Routes Overview

### Public Routes
- `GET /health` - Server health check
- `GET /` - API info
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/settings/tax-rate` - Tax rate retrieval

### Protected Routes (Require JWT)
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

- `GET /api/sales` - List sales
- `POST /api/sales` - Create sale
- `POST /api/sales/verify/:reference` - Verify payment

- `GET /api/dashboard/stats` - Dashboard statistics

- `GET /api/settings` - Get settings
- `PUT /api/settings/:key` - Update settings

### Admin Routes (Require Admin Role)
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new admin/user
- `GET /api/admin/users/:userId` - Get user details
- `PUT /api/admin/users/:userId/role` - Update user role
- `PUT /api/admin/users/:userId/deactivate` - Deactivate user
- `PUT /api/admin/users/:userId/activate` - Activate user
- `PUT /api/admin/users/:userId/reset-password` - Reset user password

### Audit Routes (Admin Only)
- `GET /api/audit/logs` - Retrieve audit logs
- `GET /api/audit/user/:userId` - Get user-specific audit logs
- `GET /api/audit/stats` - Get audit statistics
- `GET /api/audit/export` - Export audit logs (CSV/JSON)

### Auth Routes (Protected)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/logout-all` - Logout from all devices

## Database Schema

### Tables
- `users` - User accounts with roles & auth info
- `products` - Inventory items
- `sales` - Transaction records
- `sales_items` - Line items per transaction
- `refresh_tokens` - Token storage for refresh flow
- `audit_logs` - Complete audit trail

## File Naming Conventions

### Frontend
- **Components**: PascalCase (e.g., `ProductList.jsx`)
- **Pages**: PascalCase + "Page" suffix (e.g., `DashboardPage.jsx`)
- **Utilities**: camelCase (e.g., `api.js`)
- **Contexts**: PascalCase + "Context" suffix (e.g., `AuthContext.jsx`)

### Backend
- **Controllers**: camelCase (e.g., `authController.js`)
- **Routes**: camelCase (e.g., `products.js`)
- **Middleware**: camelCase (e.g., `rateLimiter.js`)
- **Utilities**: camelCase (e.g., `errorHandler.js`)
- **Validations**: camelCase (e.g., `productValidation.js`)

## Git Structure

### Gitignored Directories
- `client/node_modules/` & `client/dist/`
- `server/node_modules/` & `server/logs/` & `server/backups/`
- `.env` files (use `.env.example` templates)

### Important Files to Commit
- Source code (all `.jsx`, `.js` files)
- Configuration files (`.eslint.config.js`, `vite.config.js`, etc.)
- Documentation (`.md` files)
- Examples (`.env.example`, `docker-compose.yml`)

## Docker Structure

```
docker-compose.yml                # Orchestrates frontend, backend, database
├── services:
│   ├── api (backend)
│   ├── web (frontend)
│   └── postgres (database - via Supabase)
```

## Environment Files

- `client/.env` & `client/.env.example`
- `server/.env` & `server/.env.example`

All `.env` files are gitignored. Always update `.env.example` when adding new variables.
