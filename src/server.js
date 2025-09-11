
console.log('SERVER.JS FILE IS EXECUTING');

console.log('SERVER.JS FILE IS EXECUTING');
require('dotenv').config();
const { setupEmail } = require('./email.js');

// Initialize the email service
console.log("Attempting to set up email service...");
setupEmail();

const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
require('./passport-setup.js'); // Carrega a configuração do Passport

const { checkGameAccess } = require('./middleware.js');

const authRoutes = require('./routes/auth.js');
const userRoutes = require('./routes/user.js');
const gameRoutes = require('./routes/game.js');
const paymentRoutes = require('./routes/payment.js');

const app = express();
const PORT = 3000;

// Add a request logger middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Configuração da sessão
app.use(session({
    secret: 'uma-chave-secreta-muito-forte', // Em produção, use uma variável de ambiente
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Em produção, use 'true' com HTTPS
}));

// Middlewares
app.use(express.json()); // Para parsear JSON no corpo das requisições

// Allow embedding in iframes for testing purposes
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'ALLOWALL'); // Use with caution in production
    next();
});

// Use routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', gameRoutes);
app.use('/api', paymentRoutes);

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

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
