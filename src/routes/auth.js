
const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../database.js');

const router = express.Router();
const saltRounds = 10;
const PORT = 3000;

// Função para gerar um token aleatório
const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Rota para registrar um novo usuário
router.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Usuário, e-mail e senha são obrigatórios.' });
    }

    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao processar a senha.' });
        }

        const sql = 'INSERT INTO users (username, email, password, subscription_type, daily_time_left, last_login_date) VALUES (?, ?, ?, ?, ?, ?)';
        const initialDailyTime = 900; // 15 minutes in seconds
        const now = Date.now();
        db.run(sql, [username, email, hash, 'none', initialDailyTime, now], function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(409).json({ message: 'Nome de usuário ou e-mail já existem.' });
                }
                return res.status(500).json({ message: 'Erro ao registrar o usuário.' });
            }

            const userId = this.lastID;
            const confirmationToken = generateToken();
            const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // Token válido por 24 horas

            db.run('INSERT INTO email_confirmations (user_id, token, expires_at) VALUES (?, ?, ?)', [userId, confirmationToken, expiresAt], (err) => {
                if (err) {
                    console.error('Erro ao salvar token de confirmação', err.message);
                    return res.status(500).json({ message: 'Erro ao registrar o usuário (token).', detail: err.message });
                }

                // --- Placeholder para envio de e-mail de confirmação ---
                const confirmationLink = `http://localhost:${PORT}/confirm-email?token=${confirmationToken}`;
                console.log(`Link de Confirmação para ${email}: ${confirmationLink}`);
                // Aqui você integraria seu serviço de envio de e-mail (Nodemailer, SendGrid, etc.)
                // Ex: sendEmail(email, 'Confirme seu Cadastro', `Clique no link: ${confirmationLink}`);
                // -------------------------------------------------------

                res.status(201).json({ message: 'Usuário registrado com sucesso! Verifique seu e-mail para confirmar o cadastro.' });
            });
        });
    });
});

// Rota para login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
    }

    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Erro no servidor.' });
        }
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Opcional: Verificar se o e-mail foi confirmado antes de logar
        // if (user.is_confirmed === 0) {
        //     return res.status(403).json({ message: 'Por favor, confirme seu e-mail antes de fazer login.' });
        // }

        bcrypt.compare(password, user.password, (err, result) => {
            if (result) {
                // Senha correta, cria a sessão
                req.session.userId = user.id;
                req.session.username = user.username;
                res.json({ message: 'Login bem-sucedido!', username: user.username });
            } else {
                res.status(401).json({ message: 'Senha incorreta.' });
            }
        });
    });
});

// Rota para solicitar recuperação de senha
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'E-mail é obrigatório.' });
    }

    db.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Erro no servidor.' });
        }
        if (!user) {
            // Para segurança, sempre retorne uma mensagem genérica
            return res.status(200).json({ message: 'Se o e-mail estiver cadastrado, as instruções serão enviadas.' });
        }

        const resetToken = generateToken();
        const expiresAt = Date.now() + (1 * 60 * 60 * 1000); // Token válido por 1 hora

        db.run('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)', [user.id, resetToken, expiresAt], (err) => {
            if (err) {
                console.error('Erro ao salvar token de recuperação', err.message);
                return res.status(500).json({ message: 'Erro ao solicitar recuperação de senha.' });
            }

            // --- Placeholder para envio de e-mail de recuperação ---
            const resetLink = `http://localhost:${PORT}/reset_password.html?token=${resetToken}`;
            console.log(`Link de Recuperação para ${email}: ${resetLink}`);
            // Aqui você integraria seu serviço de envio de e-mail
            // Ex: sendEmail(email, 'Recuperação de Senha', `Clique no link: ${resetLink}`);
            // -------------------------------------------------------

            res.status(200).json({ message: 'Se o e-mail estiver cadastrado, as instruções serão enviadas.' });
        });
    });
});

// Rota para redefinir a senha
router.post('/reset-password', (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token e nova senha são obrigatórios.' });
    }

    const now = Date.now();
    db.get('SELECT user_id FROM password_resets WHERE token = ? AND expires_at > ?', [token, now], (err, resetEntry) => {
        if (err) {
            return res.status(500).json({ message: 'Erro no servidor.' });
        }
        if (!resetEntry) {
            return res.status(400).json({ message: 'Token inválido ou expirado.' });
        }

        bcrypt.hash(newPassword, saltRounds, (err, hash) => {
            if (err) {
                return res.status(500).json({ message: 'Erro ao processar a nova senha.' });
            }

            db.run('UPDATE users SET password = ? WHERE id = ?', [hash, resetEntry.user_id], (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Erro ao redefinir a senha.' });
                }

                // Invalida o token após o uso
                db.run('DELETE FROM password_resets WHERE token = ?', [token], (err) => {
                    if (err) console.error('Erro ao deletar token de recuperação', err.message);
                });

                res.status(200).json({ message: 'Senha redefinida com sucesso!' });
            });
        });
    });
});

// Rota para logout
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao fazer logout.' });
        }
        res.json({ message: 'Logout bem-sucedido.' });
    });
});

// Rota para confirmar e-mail (exemplo)
router.get('/confirm-email', (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).send('Token de confirmação ausente.');
    }

    const now = Date.now();
    db.get('SELECT user_id FROM email_confirmations WHERE token = ? AND expires_at > ?', [token, now], (err, confirmationEntry) => {
        if (err) {
            return res.status(500).send('Erro no servidor.');
        }
        if (!confirmationEntry) {
            return res.status(400).send('Token inválido ou expirado.');
        }

        db.run('UPDATE users SET is_confirmed = 1 WHERE id = ?', [confirmationEntry.user_id], (err) => {
            if (err) {
                return res.status(500).send('Erro ao confirmar e-mail.');
            }

            // Invalida o token após o uso
            db.run('DELETE FROM email_confirmations WHERE token = ?', [token], (err) => {
                if (err) console.error('Erro ao deletar token de confirmação', err.message);
            });

            res.send('Seu e-mail foi confirmado com sucesso! Você já pode fazer login.');
        });
    });
});

module.exports = router;
