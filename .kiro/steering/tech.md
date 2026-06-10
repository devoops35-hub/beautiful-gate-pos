# Technology Stack & Build System

## Frontend Stack
- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.2.2
- **CSS Framework**: Tailwind CSS 3.4.17
- **State Management**: React Context API (AuthContext, CartContext)
- **HTTP Client**: Axios 1.13.2 with custom api.js configuration
- **UI Components**: FontAwesome icons, custom components
- **Router**: React Router DOM 7.9.6
- **Notifications**: React Hot Toast 2.6.0
- **Charts**: Chart.js 4.5.1 + react-chartjs-2
- **Database Client**: Supabase JS 2.107.0

## Backend Stack
- **Runtime**: Node.js 14+ (18+ recommended)
- **Framework**: Express.js 5.1.0
- **Database**: PostgreSQL (via Supabase)
- **Database ORM**: Supabase client
- **Authentication**: JWT with refresh tokens
- **Middleware**: 
  - Helmet 8.2.0 (security headers)
  - Express Rate Limit 7.5.1 (rate limiting)
  - CORS (cross-origin support)
- **Validation**: Joi 18.2.1
- **Password Hashing**: bcryptjs 3.0.3
- **Logging**: Winston 3.19.0 + winston-daily-rotate-file
- **Real-time**: Socket.io 4.8.1
- **Payment**: Paystack API integration
- **Environment**: dotenv 17.4.2

## Build Commands

### Frontend (client/)
```bash
npm run dev          # Start development server (Vite hot reload)
npm run build        # Production build to dist/
npm run lint         # Run ESLint checks
npm run preview      # Preview production build locally
```

### Backend (server/)
```bash
npm start            # Start server with nodemon (auto-reload)
npm run test         # Run tests (not yet implemented)
npm run migrate      # Run database migrations
npm run backup       # Create database backup
```

### Docker
```bash
docker-compose up --build -d    # Start all services
docker-compose down             # Stop all services
docker-compose logs -f api      # Follow backend logs
```

## Project Structure

### Frontend Entry
- `client/src/main.jsx` - React entry point
- `client/index.html` - HTML template

### Backend Entry
- `server/index.js` - Express server bootstrap

## Development Workflow

1. **Start Backend**: `cd server && npm start`
2. **Start Frontend**: In new terminal, `cd client && npm run dev`
3. **Backend**: Runs on `http://localhost:3003`
4. **Frontend**: Runs on `http://localhost:5173` (Vite default)
5. **API URL**: Configured via `VITE_API_URL` environment variable

## Environment Configuration

### Frontend (`client/.env`)
```
VITE_API_URL=http://localhost:3003
```

### Backend (`server/.env`)
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3003)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing
- `PAYSTACK_SECRET_KEY` - Paystack payment gateway key
- `PAYSTACK_PUBLIC_KEY` - Paystack public key
- `CORS_ORIGINS` - Allowed CORS origins

## Key Technologies & Patterns

### Authentication
- JWT tokens (15-minute expiry)
- Refresh tokens (7-day expiry)
- Token stored in localStorage (frontend)
- Authorization header: `Authorization: Bearer <token>`

### API Communication
- RESTful endpoints (`/api/*`)
- JSON request/response format
- Consistent response envelope: `{ success, message, data, details }`
- Error responses include specific field-level details

### Validation
- Server-side: Joi schemas for all inputs
- Client-side: Form validation before submission
- All CRUD operations validated

### Logging
- Winston with 4 severity levels (error, warn, info, debug)
- Daily log rotation with 14-30 day retention
- Separate logs for: application, errors, requests, audit
- Located in `server/logs/`

### Security
- Password hashing: bcryptjs (10 rounds)
- CORS: Configurable, no wildcards in production
- Helmet.js security headers enabled
- Rate limiting: 5 auth attempts per 15 min (configurable)
- HTTPS ready (via reverse proxy in production)

## Database Setup

### Migrations
- Run `node server/scripts/migrate.js` before first run
- Automatic schema creation for PostgreSQL
- Tables: users, products, sales, sales_items, refresh_tokens, audit_logs

### Backup Strategy
- Automated daily backups via cron
- Scripts: `server/scripts/backup.sh` (Linux/Mac) or `backup.bat` (Windows)
- 7-day retention policy
- Stored in `server/backups/` directory

## Testing (Not Yet Implemented)

Current status: No automated tests configured.

Recommended setup:
- Unit tests: Jest
- Integration tests: Supertest + Jest
- E2E tests: Cypress or Playwright
- Coverage target: 80%+

## Code Quality Tools

### Linting
- ESLint configured for frontend
- Run: `npm run lint` (client only)

### Pre-commit Checks
- No pre-commit hooks configured (use git hooks if needed)

## Containerization

### Docker Images
- Frontend: Node 18 base + Vite build
- Backend: Node 18 base + Express server
- Database: PostgreSQL 15 (via Supabase cloud or Docker)

### Docker Compose
- Service orchestration in `docker-compose.yml`
- Volumes for logs and database persistence
- Health checks configured
- Environment variables propagated

## Performance Considerations

- Vite dev server: ~100ms cold start, <50ms HMR
- Express server: <100ms average response time
- Rate limiting prevents DoS
- Logging overhead: ~5-20ms per request
- Database query: ~20-50ms average
- Socket.io: Real-time updates for UI sync

## Deployment Artifacts

### Build Outputs
- **Frontend**: `client/dist/` - Static files ready for CDN/hosting
- **Backend**: Source code + dependencies (no pre-built artifact)

### Docker
- Both frontend and backend containerized
- Images can be pushed to Docker registry
- `docker-compose.yml` enables single-command deployment

## Production Configuration

- Environment: Set `NODE_ENV=production`
- API URL: Point to production backend via environment variable
- Database: PostgreSQL (Supabase or self-hosted)
- Reverse proxy: Nginx recommended for HTTPS/load balancing
- Monitoring: Winston logs + external monitoring service
