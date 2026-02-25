const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const pgSession = require('connect-pg-simple')(session);
const pg = require('pg'); // Required for pg.Pool

const config = require('./config');
const logger = require('./logger');
const { setupEmail } = require('./email.js');
const { runMigrations } = require('./run-migrations');
const db = require('./database'); // Use shared knex instance/connection
require('./passport-setup.js');

const { checkGameAccess, checkMaintenanceMode } = require('./middleware.js');
const app = express();
const PORT = config.port;

// ...
app.use(checkMaintenanceMode);

const adminRoutes = require('./routes/admin.js');
const authRoutes = require('./routes/auth.js');
const userRoutes = require('./routes/user.js');
const gameRoutes = require('./routes/game.js');
const paymentRoutes = require('./routes/payment.js');
const contactRoutes = require('./routes/contact.js');

// Logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// Proxy trust
app.set('trust proxy', 1);

// Security Headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
            "style-src": ["'self'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "'unsafe-inline'"],
            "font-src": ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
            "img-src": ["'self'", "data:", "https://lh3.googleusercontent.com", "https://img.icons8.com", "meu-portal-jogos-conteudo.vercel.app"],
            "frame-src": ["'self'", "meu-portal-jogos-conteudo.vercel.app", "https://quiz-educacional-copia-copia-3-copia.fly.dev"],
            "connect-src": ["'self'", "https://cdn.jsdelivr.net"],
            "frame-ancestors": ["'self'", "http://localhost:3000", "http://localhost:3001"]
        }
    }
}));

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Initialize Email
logger.info("Attempting to set up email service...");
setupEmail();

// Session Configuration
let sessionStore;
if (process.env.DATABASE_URL) {
    // If using PG, create a pool for sessions to be safe/independent or reuse config
    const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    sessionStore = new pgSession({
        pool: pool,
        tableName: 'session',
        createTableIfMissing: true
    });
    logger.info('Usando Postgres Session Store.');
} else {
    // Fallback for dev/sqlite
    sessionStore = new session.MemoryStore();
    logger.info('Usando Memory Session Store (Dev).');
}

app.use(session({
    store: sessionStore,
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: config.isProduction,
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Parse JSON for all routes EXCEPT the Stripe webhook (which needs raw body)
app.use((req, res, next) => {
    if (req.originalUrl === '/api/payment/webhook') {
        next();
    } else {
        express.json()(req, res, next);
    }
});

// API Rate Limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Muitas requisições feitas a partir deste IP.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);

app.use('/api', gameRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api', contactRoutes);
app.use('/api/admin', adminRoutes);

// Static Files & Frontend Serving
app.use('/assets', (req, res, next) => {
    next();
}, express.static(path.join(__dirname, '..', 'assets')));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/games', express.static(path.join(__dirname, '..', 'public', 'games')));
app.use('/games', checkGameAccess);

// Serve HTML pages (Legacy Frontend) - REMOVED
// The frontend is now handled by Next.js in the 'client' directory.
// Routes are handled by vercel.json or the Next.js server.

// Error Handler
app.use((err, req, res, next) => {
    logger.error(`Erro: ${err.message}`, { stack: err.stack });
    res.status(err.statusCode || 500).json({
        message: err.message || 'Ocorreu um erro interno no servidor.'
    });
});

// Start Server (Only if run directly)
async function startServer() {
    try {
        if (config.isProduction) {
            logger.info('Iniciando tentativa de migração automática...');
            // Tenta rodar migrações, mas não mata o servidor se falhar
            try {
                await runMigrations();
                logger.info('Migrações automáticas concluídas.');
            } catch (migrationError) {
                logger.error('⚠️ ALERTA: Falha nas migrações automáticas. O servidor continuará iniciando para permitir correções manuais via /api/admin/migrate-db.', migrationError);
            }
        }
        app.listen(PORT, () => {
            logger.info(`Servidor rodando em http://localhost:${PORT}`);
        });
    } catch (error) {
        logger.error("Falha crítica ao iniciar servidor:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

// Server ready
module.exports = app;
