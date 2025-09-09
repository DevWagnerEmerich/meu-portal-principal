
const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../database.js');
const { sendEmail } = require('../email.js');

const router = express.Router();
const saltRounds = 10;
const PORT = 3000;

// Função para gerar um token aleatório
const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Rota para registrar um novo usuário
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Usuário, e-mail e senha são obrigatórios.' });
    }

    try {
        const hash = await bcrypt.hash(password, saltRounds);

        const sql = 'INSERT INTO users (username, email, password, subscription_type, daily_time_left, last_login_date) VALUES (?, ?, ?, ?, ?, ?)';
        const initialDailyTime = 900; // 15 minutes in seconds
        const now = Date.now();

        db.run(sql, [username, email, hash, 'none', initialDailyTime, now], async function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(409).json({ message: 'Nome de usuário ou e-mail já existem.' });
                }
                return res.status(500).json({ message: 'Erro ao registrar o usuário.' });
            }

            const userId = this.lastID;
            const confirmationToken = generateToken();
            const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // Token válido por 24 horas

            db.run('INSERT INTO email_confirmations (user_id, token, expires_at) VALUES (?, ?, ?)', [userId, confirmationToken, expiresAt], async (err) => {
                if (err) {
                    console.error('Erro ao salvar token de confirmação', err.message);
                    return res.status(500).json({ message: 'Erro ao registrar o usuário (token).', detail: err.message });
                }

                // Envia o e-mail de confirmação
                const confirmationLink = `http://localhost:${PORT}/api/confirm-email?token=${confirmationToken}`;
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
                    // Mesmo que o e-mail falhe, o usuário foi criado.
                    // Poderíamos ter uma lógica para reenviar ou alertar o admin.
                    res.status(201).json({ message: 'Usuário registrado, mas houve um problema ao enviar o e-mail de confirmação.' });
                }
            });
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao processar o registro.' });
    }
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

                // --- Trial Logic: Reset daily_time_left if new day ---
                const today = new Date().setHours(0, 0, 0, 0); // Start of today
                const lastLoginDay = user.last_login_date ? new Date(user.last_login_date).setHours(0, 0, 0, 0) : 0;

                if (today > lastLoginDay) {
                    const resetSql = 'UPDATE users SET daily_time_left = ?, last_login_date = ? WHERE id = ?';
                    const initialDailyTime = 900; // 15 minutes in seconds
                    const now = Date.now();
                    db.run(resetSql, [initialDailyTime, now, user.id], (updateErr) => {
                        if (updateErr) {
                            console.error('Erro ao resetar daily_time_left:', updateErr.message);
                        } else {
                            console.log(`daily_time_left resetado para o usuário ${user.username}`);
                        }
                    });
                }
                // --- End Trial Logic ---

                res.json({ message: 'Login bem-sucedido!', username: user.username });
            } else {
                res.status(401).json({ message: 'Senha incorreta.' });
            }
        });
    });
});

// Rota para solicitar recuperação de senha
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'E-mail é obrigatório.' });
    }

    try {
        db.get('SELECT id, username FROM users WHERE email = ?', [email], (err, user) => {
            if (err) {
                return res.status(500).json({ message: 'Erro no servidor.' });
            }
            if (!user) {
                // Para segurança, sempre retorne uma mensagem genérica
                return res.status(200).json({ message: 'Se o e-mail estiver cadastrado, as instruções serão enviadas.' });
            }

            const resetToken = generateToken();
            const expiresAt = Date.now() + (1 * 60 * 60 * 1000); // Token válido por 1 hora

            db.run('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)', [user.id, resetToken, expiresAt], async (err) => {
                if (err) {
                    console.error('Erro ao salvar token de recuperação', err.message);
                    return res.status(500).json({ message: 'Erro ao solicitar recuperação de senha.' });
                }

                // Envia o e-mail de recuperação de senha
                const resetLink = `http://localhost:${PORT}/reset_password.html?token=${resetToken}`;
                try {
                    await sendEmail({
                        to: email,
                        subject: 'Recuperação de Senha - Educatech',
                        text: `Olá ${user.username}, você solicitou a recuperação de senha. Clique no link a seguir para redefinir sua senha: ${resetLink}`,
                        html: `<p>Olá ${user.username},</p><p>Você solicitou a recuperação de senha. Clique no link abaixo para redefinir sua senha:</p><a href="${resetLink}">Redefinir Senha</a>`
                    });
                } catch (emailError) {
                    console.error('Falha ao enviar e-mail de recuperação:', emailError);
                    // Não revele ao cliente que o envio do e-mail falhou por segurança
                }

                res.status(200).json({ message: 'Se o e-mail estiver cadastrado, as instruções serão enviadas.' });
            });
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao processar a solicitação.' });
    }
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

            res.redirect('/login.html?status=email_confirmed');
        });
    });
});

module.exports = router;
