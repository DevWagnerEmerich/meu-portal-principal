const express = require('express');
const router = express.Router();
const db = require('../database'); // Nosso novo módulo de DB

// Rota para verificar o status de login do usuário
router.get('/user-status', async (req, res) => {
    if (req.session.userId) {
        try {
            // Convertido para usar db.query com async/await e a sintaxe do PostgreSQL ($1)
            const { rows } = await db.query('SELECT username, subscription_type, role FROM users WHERE id = $1', [req.session.userId]);
            const user = rows[0];

            if (user) {
                res.json({
                    loggedIn: true,
                    username: user.username,
                    subscription_type: user.subscription_type,
                    role: user.role
                });
            } else {
                // Caso o usuário da sessão não seja encontrado no DB
                res.json({ loggedIn: false });
            }
        } catch (error) {
            console.error('Erro ao buscar status do usuário:', error);
            res.status(500).json({ message: 'Erro interno ao verificar o status do usuário.' });
        }
    } else {
        res.json({ loggedIn: false });
    }
});

// Rota para buscar os jogos favoritos de um usuário
router.get('/user/favorites', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }
    try {
        const { rows } = await db.query('SELECT game_id FROM user_favorites WHERE user_id = $1', [req.session.userId]);
        res.json(rows.map(row => row.game_id));
    } catch (error) {
        console.error('Erro ao buscar favoritos:', error);
        res.status(500).json({ message: 'Erro ao buscar jogos favoritos.' });
    }
});

// Rota para adicionar um jogo aos favoritos
router.post('/user/favorites', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }
    const { game_id } = req.body;
    if (!game_id) {
        return res.status(400).json({ message: 'game_id é obrigatório.' });
    }
    try {
        await db.query('INSERT INTO user_favorites (user_id, game_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (user_id, game_id) DO NOTHING', [req.session.userId, game_id]);
        res.status(201).json({ message: 'Jogo adicionado aos favoritos.' });
    } catch (error) {
        console.error('Erro ao adicionar favorito:', error);
        res.status(500).json({ message: 'Erro ao adicionar jogo aos favoritos.' });
    }
});

// Rota para remover um jogo dos favoritos
router.delete('/user/favorites/:game_id', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }
    const { game_id } = req.params;
    try {
        await db.query('DELETE FROM user_favorites WHERE user_id = $1 AND game_id = $2', [req.session.userId, game_id]);
        res.status(200).json({ message: 'Jogo removido dos favoritos.' });
    } catch (error) {
        console.error('Erro ao remover favorito:', error);
        res.status(500).json({ message: 'Erro ao remover jogo dos favoritos.' });
    }
});

// Rota para obter o status da oferta de boas-vindas
router.get('/user/offer-status', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }
    try {
        const { rows } = await db.query('SELECT created_at FROM users WHERE id = $1', [req.session.userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        const userCreationDate = new Date(rows[0].created_at);
        const offerEndDate = new Date(userCreationDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // Oferta de 7 dias
        const now = new Date();

        if (now < offerEndDate) {
            res.json({ offerActive: true, offerEndDate: offerEndDate.getTime() });
        } else {
            res.json({ offerActive: false });
        }
    } catch (error) {
        console.error('Erro ao verificar status da oferta:', error);
        res.status(500).json({ message: 'Erro ao verificar status da oferta.' });
    }
});

module.exports = router;