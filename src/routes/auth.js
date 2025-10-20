const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendEmail } = require('../email.js');
const passport = require('passport');
const config = require('../config');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const userModel = require('../models/userModel.js');

const router = express.Router();
const saltRounds = 10;

// Define os limitadores de requisição
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20, // Limita cada IP a 20 requisições por janela
    message: 'Muitas requisições criadas a partir deste IP, por favor, tente novamente após 15 minutos'
});

const sensitiveApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // Limita cada IP a 10 requisições por janela para rotas sensíveis
    message: 'Muitas tentativas a partir deste IP, por favor, tente novamente após 15 minutos'
});

// Função para gerar um token aleatório
const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Rota para registrar um novo usuário
router.post('/register', [
    body('username', 'O nome de usuário deve ter no mínimo 3 caracteres.').isLength({ min: 3 }).trim().escape(),
    body('email', 'Por favor, insira um e-mail válido.').isEmail().normalizeEmail(),
    body('password', 'A senha deve ter no mínimo 6 caracteres.').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Erro de validação.', errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
        const hash = await bcrypt.hash(password, saltRounds);
        const { id: userId } = await userModel.createUser({ username, email, hash });

        const confirmationToken = generateToken();
        const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 horas

        await userModel.createEmailConfirmationToken({ userId, token: confirmationToken, expiresAt });

        const confirmationLink = `${config.domain}/api/confirm-email?token=${confirmationToken}`;
        try {
            await sendEmail({
                to: email,
                subject: 'Confirme seu cadastro no Educatech',
                text: `Olá ${username}, por favor, confirme seu e-mail clicando no seguinte link: ${confirmationLink}`,
                html: `<p>Olá ${username},</p><p>Por favor, confirme seu e-mail clicando no link abaixo:</p><a href="${confirmationLink}">Confirmar E-mail</a>`
            });
            res.status(201).json({ message: 'Usuário registrado com sucesso! Verifique seu e-mail para confirmar o cadastro.' });
        } catch (emailError) {
            console.error('Falha ao enviar e-mail de confirmação:', emailError);
            res.status(201).json({ message: 'Usuário registrado, mas o envio do e-mail de confirmação falhou.' });
        }

    } catch (error) {
        if (error.code === '23505') { // 23505 é o código de violação de unicidade do PostgreSQL
            return res.status(409).json({ message: 'Nome de usuário ou e-mail já existem.' });
        }
        console.error("Erro no registro: ", error.message);
        res.status(500).json({ message: 'Erro ao registrar o usuário.' });
    }
});

// Rota para login
router.post('/login', sensitiveApiLimiter, [
    body('username', 'Nome de usuário não pode estar vazio.').notEmpty().trim().escape(),
    body('password', 'Senha não pode estar vazia.').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Erro de validação.', errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
        const user = await userModel.findUserByUsername(username);
        if (!user) {
            // Return a generic message to avoid user enumeration attacks
            return res.status(401).json({ message: 'Usuário ou senha inválidos.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Usuário ou senha inválidos.' });
        }

        req.session.userId = user.id;
        req.session.username = user.username;

        await userModel.updateUserLastLogin(user.id);

        if (user.show_welcome_modal) {
            await userModel.disableWelcomeModal(user.id);
        }

        res.json({
            message: 'Login bem-sucedido!',
            username: user.username,
            showWelcomeModal: user.show_welcome_modal
        });

    } catch (error) {
        console.error('Erro no login:', error.message);
        res.status(500).json({ message: 'Erro no servidor durante o login.' });
    }
});

// Rota para solicitar recuperação de senha
router.post('/forgot-password', sensitiveApiLimiter, [
    body('email', 'Por favor, insira um e-mail válido.').isEmail().normalizeEmail()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Erro de validação.', errors: errors.array() });
    }

    const { email } = req.body;

    try {
        const user = await userModel.findUserByEmail(email);
        if (user) {
            const resetToken = generateToken();
            const expiresAt = Date.now() + (1 * 60 * 60 * 1000); // 1 hora

            await userModel.createPasswordResetToken({ userId: user.id, token: resetToken, expiresAt });

            const resetLink = `${config.domain}/reset_password.html?token=${resetToken}`;
            try {
                await sendEmail({
                    to: email,
                    subject: 'Recuperação de Senha - Educatech',
                    text: `Olá ${user.username}, você solicitou a recuperação de senha. Clique no link a seguir: ${resetLink}`,
                    html: `<p>Olá ${user.username},</p><p>Clique no link para redefinir sua senha:</p><a href="${resetLink}">Redefinir Senha</a>`
                });
            } catch (emailError) {
                console.error('Falha ao enviar e-mail de recuperação:', emailError);
                // Não revelamos o erro ao usuário por segurança
            }
        }
        // Resposta genérica para não revelar se um e-mail existe no sistema
        res.status(200).json({ message: 'Se o e-mail estiver cadastrado, as instruções serão enviadas.' });

    } catch (error) {
        console.error('Erro na recuperação de senha:', error.message);
        res.status(500).json({ message: 'Erro interno ao processar a solicitação.' });
    }
});

// Rota para redefinir a senha
router.post('/reset-password', sensitiveApiLimiter, [
    body('token', 'Token é obrigatório.').notEmpty(),
    body('newPassword', 'A nova senha deve ter no mínimo 6 caracteres.').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Erro de validação.', errors: errors.array() });
    }

    const { token, newPassword } = req.body;

    try {
        const resetEntry = await userModel.findResetToken(token);
        if (!resetEntry) {
            return res.status(400).json({ message: 'Token inválido ou expirado.' });
        }

        const hash = await bcrypt.hash(newPassword, saltRounds);
        await userModel.updateUserPassword({ userId: resetEntry.user_id, hash });
        await userModel.deletePasswordResetToken(token);

        res.status(200).json({ message: 'Senha redefinida com sucesso!' });

    } catch (error) {
        console.error('Erro ao redefinir senha:', error.message);
        res.status(500).json({ message: 'Erro interno ao redefinir a senha.' });
    }
});

// Rota para logout
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao fazer logout.' });
        }
        res.clearCookie('connect.sid'); // Limpa o cookie da sessão
        res.json({ message: 'Logout bem-sucedido.' });
    });
});

// Rota para confirmar e-mail
router.get('/confirm-email', async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).send('Token de confirmação ausente.');
    }

    try {
        const confirmationEntry = await userModel.findEmailConfirmationToken(token);
        if (!confirmationEntry) {
            return res.status(400).send('Token inválido ou expirado.');
        }

        await userModel.confirmUserEmail(confirmationEntry.user_id);
        await userModel.deleteEmailConfirmationToken(token);

        res.redirect('/login.html?status=email_confirmed');

    } catch (error) {
        console.error('Erro ao confirmar e-mail:', error.message);
        res.status(500).send('Erro interno ao confirmar o e-mail.');
    }
});

// Rotas de autenticação com Google
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login.html?status=google_auth_failed' }),
  (req, res) => {
    if (req.user) {
        req.session.userId = req.user.id;
        req.session.username = req.user.username;
    }
    res.redirect('/');
  }
);

module.exports = router;
