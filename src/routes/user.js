
const express = require('express');
const db = require('../database.js');

const router = express.Router();

// Rota para verificar status do usuário
router.get('/user-status', (req, res) => {
    if (req.session.userId) {
        db.get('SELECT username, subscription_type, daily_time_left FROM users WHERE id = ?', [req.session.userId], (err, user) => {
            if (err) {
                console.error('Erro ao buscar dados do usuário:', err.message);
                return res.status(500).json({ message: 'Erro no servidor.' });
            }
            if (user) {
                res.json({
                    loggedIn: true,
                    username: user.username,
                    subscriptionType: user.subscription_type,
                    dailyTimeLeft: user.daily_time_left
                });
            } else {
                req.session.destroy(); // Clear invalid session
                res.json({ loggedIn: false });
            }
        });
    } else {
        res.json({ loggedIn: false });
    }
});

// Rota para obter dados do perfil do usuário
router.get('/profile', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }

    const sql = 'SELECT username, email, subscription_type, subscription_end_date, daily_time_left FROM users WHERE id = ?';
    db.get(sql, [req.session.userId], (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Erro no servidor.' });
        }
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.json(user);
    });
});

// Rota para atualizar o perfil do usuário
router.put('/profile', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }

    const { username, email } = req.body;
    if (!username || !email) {
        return res.status(400).json({ message: 'Nome de usuário e e-mail são obrigatórios.' });
    }

    const sql = 'UPDATE users SET username = ?, email = ? WHERE id = ?';
    db.run(sql, [username, email, req.session.userId], function(err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
                return res.status(409).json({ message: 'Nome de usuário ou e-mail já existem.' });
            }
            return res.status(500).json({ message: 'Erro ao atualizar o perfil.' });
        }
        res.json({ message: 'Perfil atualizado com sucesso!' });
    });
});

// Rota para deletar a conta do usuário
router.delete('/profile', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }

    const sql = 'DELETE FROM users WHERE id = ?';
    db.run(sql, [req.session.userId], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Erro ao deletar a conta.' });
        }
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ message: 'Erro ao fazer logout após deletar a conta.' });
            }
            res.json({ message: 'Conta deletada com sucesso.' });
        });
    });
});

// Rota para assinar um plano
router.post('/subscribe', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }

    const { subscriptionType } = req.body;
    if (!subscriptionType) {
        return res.status(400).json({ message: 'Tipo de assinatura é obrigatório.' });
    }

    // Basic validation for subscription type (can be expanded)
    const validSubscriptionTypes = ['monthly', 'semestral', 'annual'];
    if (!validSubscriptionTypes.includes(subscriptionType)) {
        return res.status(400).json({ message: 'Tipo de assinatura inválido.' });
    }

    // Calculate subscription end date (example: 1 month from now for monthly)
    let subscriptionEndDate = Date.now(); // Current timestamp
    if (subscriptionType === 'monthly') {
        subscriptionEndDate += 30 * 24 * 60 * 60 * 1000; // +30 days
    } else if (subscriptionType === 'semestral') {
        subscriptionEndDate += 6 * 30 * 24 * 60 * 60 * 1000; // +6 months
    } else if (subscriptionType === 'annual') {
        subscriptionEndDate += 12 * 30 * 24 * 60 * 60 * 1000; // +12 months
    }

    const sql = 'UPDATE users SET subscription_type = ?, subscription_end_date = ? WHERE id = ?';
    db.run(sql, [subscriptionType, subscriptionEndDate, req.session.userId], function(err) {
        if (err) {
            console.error('Erro ao atualizar assinatura:', err.message);
            return res.status(500).json({ message: 'Erro ao processar a assinatura.' });
        }
        res.json({ message: `Assinatura ${subscriptionType} ativada com sucesso!` });
    });
});

module.exports = router;
