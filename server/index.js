process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Load configuration
const { PORT, CORS: CORS_CONFIG, validateEnvironment, NODE_ENV } = require('./config/constants');
const { connectDB } = require('./config/supabase');
const { globalErrorHandler } = require('./utils/errorHandler');
const { logger } = require('./config/logger');

// Load middleware
const { requestLoggingMiddleware, detailedRequestLogger, errorLoggingMiddleware } = require('./middleware/requestLogger');
const { authenticate } = require('./middleware/authMiddleware');

// Validate environment on startup
try {
  validateEnvironment();
} catch (error) {
  logger.error('❌ Configuration Error:', error.message);
  // In production, exit. In development, continue with warnings.
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// Connect to database
let dbConnected = false;
(async () => {
  try {
    await connectDB();
    dbConnected = true;
    logger.info('✅ Database connection established successfully');
  } catch (error) {
    logger.error('⚠️ Database connection warning (will retry):', error.message);
    // Don't crash the server if DB connection fails initially
    // Will retry on first request
  }
})();

// Initialize tables (PostgreSQL handles this automatically in connectDB)
logger.info('Database initialization scheduled');

const app = express();
const server = http.createServer(app);

// WebSocket configuration
const io = new Server(server, {
  cors: {
    origin: Array.isArray(CORS_CONFIG.origin) ? CORS_CONFIG.origin : [CORS_CONFIG.origin],
    methods: CORS_CONFIG.methods,
    credentials: CORS_CONFIG.credentials,
  },
  transports: ['websocket', 'polling'],
});

// Security Middleware - Helmet with CORS-friendly config
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", 'https:'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// CORS Middleware - Allow all origins for now, can be restricted later
const allowedOrigins = [
  'https://beautiful-gate-client.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Still allow it but log it
      console.log('CORS request from:', origin);
      callback(null, true); // Allow anyway for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  optionsSuccessStatus: 200,
}));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request Logging Middleware
app.use(requestLoggingMiddleware);
app.use(detailedRequestLogger);
app.use(errorLoggingMiddleware);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/products', require('./routes/products'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/audit', require('./routes/audit'));

// Test endpoint to verify API is working
app.get('/api/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString(),
  });
});

// Test CORS endpoint
app.post('/api/test-cors', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CORS is working',
    received: req.body,
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'POS Backend Server is running',
    version: '2.0.0',
    environment: NODE_ENV,
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// Error handling middleware (catch-all)
app.use(globalErrorHandler);

// WebSocket connection handler
io.on('connection', (socket) => {
  logger.info(`WebSocket User connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    logger.info(`WebSocket User disconnected: ${socket.id}`);
  });

  // Handle errors
  socket.on('error', (error) => {
    logger.logError('WebSocket Error', error, { socketId: socket.id });
  });
});

// Start server
const PORT_NUM = PORT || 3003;
server.listen(PORT_NUM, () => {
  logger.info(`\n╔════════════════════════════════════════╗`);
  logger.info(`║  🚀 POS Server running on port ${PORT_NUM.toString().padEnd(22)}║`);
  logger.info(`║  Environment: ${NODE_ENV.toUpperCase().padEnd(30)}║`);
  logger.info(`║  Time: ${new Date().toLocaleTimeString().padEnd(28)}║`);
  logger.info(`╚════════════════════════════════════════╝\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.warn('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.warn('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.logError('Uncaught Exception', error);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.logError('Unhandled Rejection', new Error(String(reason)));
  process.exit(1);
});
