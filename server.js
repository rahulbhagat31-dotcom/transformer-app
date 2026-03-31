require('dotenv').config();

// CRITICAL: Validate JWT_SECRET is set before starting server
if (!process.env.JWT_SECRET) {
    console.error('❌ FATAL ERROR: JWT_SECRET environment variable is not set');
    console.error('   Set JWT_SECRET in .env file (minimum 32 characters)');
    console.error('   Server cannot start without JWT_SECRET for security reasons');
    process.exit(1);
}

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { initUsersFile, initDataFiles, seedDefaultUsersIfNeeded } = require('./utils/init');
const { globalErrorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { initAuditFile } = require('./utils/audit');
const { initStageStatusFile } = require('./utils/stageControl');

// Phase 2: New utilities
const logger = require('./utils/logger');
const cache = require('./utils/cache');
const { initAutomatedBackups } = require('./utils/backup');

// Phase 3: WebSocket and exports
const http = require('http');
const socketIO = require('socket.io');
const { initWebSocket } = require('./utils/websocket');

// Route aggregator (centralizes all API routes)
const apiRoutes = require('./routes'); // 📊 Phase 3

const app = express();
const server = http.createServer(app);
// Allowed origin — configure in .env for production
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';

const io = socketIO(server, {
    cors: {
        origin: ALLOWED_ORIGIN,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// =====================
// MIDDLEWARE
// =====================

// Security headers with CSP (allows inline scripts/styles needed for existing onclick handlers)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ['\'self\''],
            scriptSrc: ['\'self\'', '\'unsafe-inline\'', 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com', 'https://unpkg.com'],
            'script-src-attr': ['\'unsafe-inline\''],
            styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
            fontSrc: ['\'self\'', 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
            imgSrc: ['\'self\'', 'data:', 'blob:'],
            connectSrc: ['\'self\'', 'ws:', 'wss:', ALLOWED_ORIGIN, ALLOWED_ORIGIN.replace(/^https?/, match => match === 'https' ? 'wss' : 'ws'), 'https://cdn.jsdelivr.net', 'https://unpkg.com'],
            objectSrc: ['\'none\''],
            frameSrc: ['\'none\'']
        }
    },
    crossOriginEmbedderPolicy: false
}));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Login rate limiting (stricter)
const loginLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX, 10) || 5,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many login attempts. Please wait a moment and try again.'
        });
    }
});

app.use(cors({
    origin: ALLOWED_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Login rate limiting (apply to login path only)
app.use('/auth/login', loginLimiter);

// Note: JWT authentication is applied per-route, not globally
// Public routes (like /auth/login) don't require authentication

// DEBUG LOGGING (only in development)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`🔍 [DEBUG] ${req.method} ${req.url} | User: ${req.user?.id || 'none'}`);
        next();
    });
}

// =====================
// ROUTES
// =====================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve standalone exam page for each section
// exam.html reads section from URL path: location.pathname.split('/').pop()
app.get('/exam/:section', (req, res) => {
    const validSections = ['winding', 'core', 'tanking'];
    if (!validSections.includes(req.params.section.toLowerCase())) {
        return res.status(404).send('Invalid exam section. Use: /exam/winding, /exam/core, or /exam/tanking');
    }
    res.sendFile(path.join(__dirname, 'public', 'exam.html'));
});

// Favicon handler (prevents 404 errors)
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Use centralized route aggregator
// Routes are mounted at / — frontend calls with full paths like /auth/login, /transformers etc.
app.use('/', apiRoutes);

// Cache statistics endpoint (Phase 2)
app.get('/api/cache/stats', (req, res) => {
    res.json(cache.getStats());
});

// =====================
// ERROR HANDLING
// =====================
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Global process error handlers
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
});
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    process.exit(1);
});

// =====================
// INITIALIZE & START
// =====================
(async () => {
    await initUsersFile();
    await seedDefaultUsersIfNeeded();

    initDataFiles();
    initAuditFile(); // ← NEW: Initialize audit log file
    initStageStatusFile(); // ← NEW: Initialize stage status file

    // Phase 2: Initialize automated backups
    initAutomatedBackups();

    // Phase 3: Initialize WebSocket
    initWebSocket(io);


    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        logger.info(`Server started on port ${PORT}`);
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🚀 Server: http://localhost:${PORT}`);
        if (process.env.NODE_ENV !== 'production') {
            console.log('\n👤 Demo Accounts (dev only):');
            console.log('   Admin: admin / admin123');
            console.log('   Quality: quality / qc123');
            console.log('   Production: production / prod123');
            console.log('   Customer: customer1 / cust123');
        }
        console.log('\n✨ Phase 2 Features:');
        console.log('   📊 Cache: Enabled (10 min TTL)');
        console.log('   📝 Logging: Winston (logs/ directory)');
        console.log('   💾 Backups: Daily at 2 AM (backups/ directory)');
        console.log('   🔒 Validation: express-validator');
        console.log('   📈 Cache Stats: /api/cache/stats');
        console.log('\n🚀 Phase 3 Features:');
        console.log('   📊 Excel Export: /export/checklist/:stage/:wo');
        console.log('   🔧 Email Alerts: Configured (check .env)');
        console.log('   🔄 WebSocket: Real-time updates enabled');
        console.log('   📦 Export All: /export/transformers, /export/audit');
        console.log(`${'='.repeat(60)}\n`);
    });
})();
