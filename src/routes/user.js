const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database.js');
const fs = require('fs').promises;
const path = require('path');
const { body, validationResult } = require('express-validator');

// Rota para verificar status do usuário
router.get('/user-status', async (req, res) => {
    if (req.session.userId) {
        try {
            const user = await db('users')
                .where('id', req.session.userId)
                .select('username', 'subscription_type', 'created_at', 'role')
                .first();

            if (user) {
                // Calcular energia diária
                const BusinessRules = require('../business-rules');
                const LIMIT = BusinessRules.FREE_PLAYS.LIMIT;

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const startOfDayTimestamp = today.getTime();

                const playsResult = await db('game_plays')
                    .where('user_id', req.session.userId)
                    .andWhere('is_free_trial', 1)
                    .andWhere('start_time', '>=', startOfDayTimestamp)
                    .count('id as count')
                    .first();

                const playsUsed = parseInt(playsResult.count || 0, 10);
                const energy = Math.max(0, LIMIT - playsUsed);

                // Calcular status da oferta de boas-vindas
                let offerActive = false;
                let offerExpiresAt = null;
                if (user.created_at) {
                    const createdAtTime = new Date(Number(user.created_at)).getTime();
                    const offerDuration = BusinessRules.WELCOME_OFFER.DURATION_DAYS * 24 * 60 * 60 * 1000;
                    offerExpiresAt = createdAtTime + offerDuration;
                    if (Date.now() < offerExpiresAt) {
                        offerActive = true;
                    }
                }

                res.json({
                    loggedIn: true,
                    username: user.username,
                    subscriptionType: user.subscription_type,
                    role: user.role,
                    energy: energy,
                    maxEnergy: LIMIT,
                    welcomeOffer: {
                        active: offerActive,
                        expiresAt: offerExpiresAt
                    }
                });
            } else {
                req.session.destroy(() => res.json({ loggedIn: false }));
            }
        } catch (err) {
            console.error('Erro ao buscar dados do usuário:', err);
            return res.status(500).json({ message: 'Erro no servidor.' });
        }
    } else {
        res.json({ loggedIn: false });
    }
});

// --- ROTAS DO PERFIL --- 

// Rota para obter dados do perfil do usuário
router.get('/profile', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }

    try {
        const user = await db('users')
            .where('id', req.session.userId)
            .select('username', 'email', 'subscription_type', 'subscription_end_date')
            .first();

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.json(user);
    } catch (err) {
        console.error('Erro ao buscar perfil:', err);
        return res.status(500).json({ message: 'Erro no servidor.' });
    }
});

// Rota para atualizar o perfil do usuário
router.put('/profile', [
    body('username', 'Nome de usuário é obrigatório.').notEmpty().trim().escape(),
    body('email', 'E-mail inválido.').isEmail().normalizeEmail()
], async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Erro de validação.', errors: errors.array() });
    }

    const { username, email } = req.body;

    try {
        await db('users')
            .where('id', req.session.userId)
            .update({ username, email });

        res.json({ message: 'Perfil atualizado com sucesso!' });
    } catch (err) {
        // SQLITE_CONSTRAINT
        if (err.code === 'SQLITE_CONSTRAINT' || err.code === '23505') {
            return res.status(409).json({ message: 'Nome de usuário ou e-mail já existem.' });
        }
        console.error('Erro ao atualizar perfil:', err);
        return res.status(500).json({ message: 'Erro ao atualizar o perfil.' });
    }
});

// Rota para deletar a conta do usuário
router.delete('/profile', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }

    try {
        await db('users').where('id', req.session.userId).del();

        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ message: 'Erro ao fazer logout após deletar a conta.' });
            }
            res.clearCookie('connect.sid');
            res.json({ message: 'Conta deletada com sucesso.' });
        });
    } catch (err) {
        console.error('Erro ao deletar conta:', err);
        return res.status(500).json({ message: 'Erro ao deletar a conta.' });
    }
});

// Rota para mudar a senha do usuário
router.put('/profile/password', [
    body('currentPassword', 'Senha atual é obrigatória.').notEmpty(),
    body('newPassword', 'A nova senha deve ter no mínimo 6 caracteres.').isLength({ min: 6 })
], async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Erro de validação.', errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    const saltRounds = 10;

    try {
        const user = await db('users').where('id', req.session.userId).select('password').first();

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Senha atual incorreta.' });
        }

        const hash = await bcrypt.hash(newPassword, saltRounds);
        await db('users').where('id', req.session.userId).update({ password: hash });

        res.json({ message: 'Senha atualizada com sucesso!' });

    } catch (err) {
        console.error('Erro ao mudar senha:', err);
        return res.status(500).json({ message: 'Erro ao atualizar a senha.' });
    }
});

// --- OUTRAS ROTAS DE USUÁRIO ---

// Rota para verificar o status da oferta de boas-vindas
router.get('/user/offer-status', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }

    try {
        const user = await db('users').where('id', req.session.userId).select('created_at').first();

        if (!user || !user.created_at) {
            return res.json({ offerActive: false });
        }
        const userCreationDate = new Date(Number(user.created_at));
        const offerEndDate = new Date(userCreationDate.getTime() + (7 * 24 * 60 * 60 * 1000));
        const now = new Date();
        if (now < offerEndDate) {
            res.json({ offerActive: true, offerEndDate: offerEndDate.getTime() });
        } else {
            res.json({ offerActive: false });
        }
    } catch (err) {
        console.error('Erro no offer-status:', err);
        return res.status(500).json({ message: 'Erro no servidor.' });
    }
});

// Rota para obter o histórico de jogos do usuário
router.get('/user/play-history', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }

    try {
        const gamesList = await db('games').select('id', 'title', 'thumbnail');
        const gamesMap = new Map(gamesList.map(game => [game.id, game]));

        const rows = await db('game_plays')
            .where('user_id', req.session.userId)
            .select('game_id', 'start_time')
            .orderBy('start_time', 'desc');

        const history = rows.map(row => {
            const gameDetails = gamesMap.get(row.game_id);
            return {
                game_id: row.game_id,
                title: gameDetails ? gameDetails.title : 'Jogo Desconhecido',
                thumbnail: gameDetails ? gameDetails.thumbnail : '/path/to/default/image.webp',
                played_at: row.start_time
            };
        });

        res.json(history);

    } catch (error) {
        console.error('Erro ao ler games.json ou processar o histórico:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Rotas para Favoritos

// GET: Listar favoritos de um usuário
router.get('/user/favorites', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }
    try {
        const rows = await db('user_favorites').where('user_id', req.session.userId).select('game_id');
        res.json(rows.map(row => row.game_id));
    } catch (err) {
        console.error("Erro ao buscar favoritos:", err);
        return res.status(500).json({ message: 'Erro ao buscar favoritos.' });
    }
});

// POST: Adicionar um favorito
router.post('/user/favorites', [
    body('game_id', 'game_id é obrigatório.').notEmpty()
], async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Erro de validação.', errors: errors.array() });
    }

    const { game_id } = req.body;
    try {
        await db('user_favorites').insert({
            user_id: req.session.userId,
            game_id,
            created_at: Date.now()
        });
        res.status(201).json({ message: 'Jogo favoritado com sucesso!' });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT' || err.code === '23505') {
            return res.status(409).json({ message: 'Jogo já favoritado.' });
        }
        if (err.code === '23503') {
            return res.status(404).json({ message: 'Jogo ou usuário não encontrado.' });
        }
        console.error("Erro ao favoritar:", err);
        return res.status(500).json({ message: 'Erro ao favoritar o jogo.' });
    }
});

// DELETE: Remover um favorito
router.delete('/user/favorites/:game_id', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }
    const { game_id } = req.params;
    try {
        const deletedCount = await db('user_favorites')
            .where('user_id', req.session.userId)
            .where('game_id', game_id)
            .del();

        if (deletedCount === 0) {
            return res.status(404).json({ message: 'Favorito não encontrado.' });
        }
        res.status(200).json({ message: 'Favorito removido com sucesso!' });
    } catch (err) {
        console.error("Erro ao remover favorito:", err);
        return res.status(500).json({ message: 'Erro ao remover favorito.' });
    }
});

module.exports = router;
