const logger = require('./logger');

<<<<<<< HEAD
logger.info('SERVER.JS FILE IS EXECUTING');
=======
console.log('--- INÍCIO DA DEPURAÇÃO DE VARIÁVEIS DE AMBIENTE ---');
console.log(`Debug DATABASE_URL: ${process.env.DATABASE_URL}`);
console.log(`Debug GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID}`);
console.log(`Debug GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? 'Presente' : 'AUSENTE'}`);
console.log(`Debug DOMAIN: ${process.env.DOMAIN}`);
console.log('--- FIM DA DEPURAÇÃO ---');

console.log('Debug DATABASE_URL:', process.env.DATABASE_URL);

console.log('SERVER.JS FILE IS EXECUTING');
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec

const config = require('./config');
const { setupEmail } = require('./email.js');

// Initialize the email service
logger.info("Attempting to set up email service...");
setupEmail();

const express = require('express');
const helmet = require('helmet');
<<<<<<< HEAD
const cors = require('cors');
=======
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
const path = require('path');
const session = require('express-session');
const passport = require('passport');
require('./passport-setup.js'); // Carrega a configuração do Passport

const { checkGameAccess } = require('./middleware.js');
const adminRoutes = require('./routes/admin.js'); // Add this line

const authRoutes = require('./routes/auth.js');
const userRoutes = require('./routes/user.js');
const gameRoutes = require('./routes/game.js');
const paymentRoutes = require('./routes/payment.js');
const contactRoutes = require('./routes/contact.js');
const rateLimit = require('express-rate-limit');

const app = express();
<<<<<<< HEAD

app.use(cors({
    origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
=======
app.set('trust proxy', 1); // Confia no primeiro proxy (necessário para o Render)
app.use(helmet({
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
            "style-src": ["'self'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "'unsafe-inline'"],
            "font-src": ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
<<<<<<< HEAD
            "img-src": ["'self'", "data:", "https://lh3.googleusercontent.com", "https://img.icons8.com"],
            "connect-src": ["'self'", "https://cdn.jsdelivr.net"],
            "frame-ancestors": ["'self'", "http://localhost:3000"]
=======
            "img-src": ["'self'", "data:", "https://lh3.googleusercontent.com", "https://img.icons8.com", "meu-portal-jogos-conteudo.vercel.app"],
            "frame-src": ["'self'", "meu-portal-jogos-conteudo.vercel.app", "https://quiz-educacional-copia-copia-3-copia.fly.dev"],
            "connect-src": ["'self'", "https://cdn.jsdelivr.net"]
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
        }
    }
}));
const PORT = config.port;

// Add a request logger middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

<<<<<<< HEAD
// Configuração da sessão
const pgSession = require('connect-pg-simple')(session);
const pg = require('pg');

let sessionStore;
if (process.env.DATABASE_URL) {
    const pgPool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for Supabase
    });
    sessionStore = new pgSession({
        pool: pgPool,
        tableName: 'session',
        createTableIfMissing: true // Tenta criar se não existir, mas já temos migration
    });
    logger.info('Usando Postgres Session Store.');
} else {
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
=======
const pgSession = require('connect-pg-simple')(session);
const db = require('./database');

// Configuração da sessão com armazenamento no PostgreSQL
app.use(session({
    store: new pgSession({
        pool: db.pool,                // Pool de conexão com o banco de dados
        tableName: 'user_sessions'    // Nome da tabela para armazenar as sessões
    }),
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: config.isProduction, // Em produção, use cookies seguros (HTTPS)
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dias
    }
}));


// Middlewares
app.use(express.json()); // Para parsear JSON no corpo das requisições

// Aplica um limitador de requisições a todas as rotas da API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limita cada IP a 100 requisições por janela
    message: 'Muitas requisições feitas a partir deste IP. Por favor, tente novamente após 15 minutos.',
    standardHeaders: true, // Retorna informações do limite nos cabeçalhos `RateLimit-*`
    legacyHeaders: false, // Desabilita os cabeçalhos `X-RateLimit-*`
});
app.use('/api', apiLimiter);

// Use routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', gameRoutes);
<<<<<<< HEAD
app.use('/api/payment', paymentRoutes);
=======
app.use('/api', paymentRoutes);
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
app.use('/api', contactRoutes);
app.use('/api/admin', adminRoutes); // Add this line

// Rota para servir as páginas HTML principais
app.use('/assets', (req, res, next) => {
    console.log('Request to /assets received');
    next();
}, express.static(path.join(__dirname, '..', 'assets')));
app.use(express.static(path.join(__dirname, '..', 'public'))); // Para servir arquivos estáticos

// Apply middleware to game routes
app.use('/games', express.static(path.join(__dirname, '..', 'public', 'games')));

// Apply middleware to specific game routes that require access control
app.use('/games', checkGameAccess);

// Rota para servir as páginas HTML principais
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'register.html'));
});

app.get('/forgot_password.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'forgot_password.html'));
});

app.get('/reset_password.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'reset_password.html'));
});

// Rota para servir a página de jogos
app.get('/games', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'games.html'));
});

// Rota para servir a página de perfil do usuário
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'profile.html'));
});

// Rota para servir a página de planos de assinatura
app.get('/subscription', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'subscription.html'));
});

app.get('/contact.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'contact.html'));
});

// Rota para servir as páginas de administração
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

<<<<<<< HEAD



if (require.main === module) {
    app.listen(PORT, () => {
        logger.info(`Servidor rodando em http://localhost:${PORT}`);
    });
}

module.exports = app;

// Middleware de tratamento de erros centralizado
app.use((err, req, res, next) => {
    logger.error(`Erro: ${err.message}`, { stack: err.stack });

    // Verifica se o erro já tem um status definido, caso contrário, usa 500
    const statusCode = err.statusCode || 500;

    // Envia uma resposta de erro padronizada
    res.status(statusCode).json({
        message: err.message || 'Ocorreu um erro interno no servidor.',
        // Em produção, você pode querer omitir o stack trace por segurança
        // stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
});
=======


const { runMigrations } = require('./run-migrations');

// Função auto-executável para rodar as migrações antes de iniciar o servidor
async function startServer() {
    try {
        console.log('Iniciando migrações do banco de dados...');
        await runMigrations();
        console.log('Migrações concluídas. Iniciando o servidor web...');

        app.listen(PORT, () => {
            console.log(`Servidor rodando em http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Falha crítica ao rodar migrações. O servidor não será iniciado.", error);
        process.exit(1);
    }
}

if (process.env.NODE_ENV !== 'production') {
    startServer();
}

// Middleware de tratamento de erros centralizado
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Erro: ${err.message}`);
    console.error(err.stack); // Loga o stack trace para depuração

    // Verifica se o erro já tem um status definido, caso contrário, usa 500
    const statusCode = err.statusCode || 500;

    // Envia uma resposta de erro padronizada
    res.status(statusCode).json({
        message: err.message || 'Ocorreu um erro interno no servidor.',
        // Em produção, você pode querer omitir o stack trace por segurança
        // stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
});

module.exports = app;
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
