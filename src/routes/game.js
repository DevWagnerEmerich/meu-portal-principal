const express = require('express');
const db = require('../database.js');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// A rota para buscar os jogos mais acessados não usa o DB, então permanece igual.
router.get('/games/most-accessed', async (req, res) => {
    try {
        const statsPath = path.join(__dirname, '..', 'data', 'game_access_stats.json');
        const gamesPath = path.join(__dirname, '..', '..', 'public', 'games.json');

        const [statsData, gamesData] = await Promise.all([
            fs.readFile(statsPath, 'utf8').catch(() => '{}'),
            fs.readFile(gamesPath, 'utf8')
        ]);

        const stats = JSON.parse(statsData);
        const games = JSON.parse(gamesData);

        const sortedGameIds = Object.keys(stats).sort((a, b) => stats[b] - stats[a]);
        const top3GameIds = sortedGameIds.slice(0, 3);

        const topGames = top3GameIds.map(id => {
            return games.find(game => game.id === id);
        }).filter(game => game);

        res.json(topGames);
    } catch (error) {
        console.error('Error fetching most accessed games:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Função auxiliar para registrar a jogada (convertida para async)
async function recordPlay(userId, gameId, isFreeTrial) {
    const startTime = new Date();
    const logSql = 'INSERT INTO game_plays (user_id, game_id, start_time, is_free_trial) VALUES ($1, $2, $3, $4) RETURNING id';
    const { rows } = await db.query(logSql, [userId, gameId, startTime, isFreeTrial]);
    return rows[0].id;
}

// API para iniciar uma sessão de jogo (convertida para async)
router.post('/game-start', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const { gameSrc } = req.body;
    if (!gameSrc) {
        return res.status(400).json({ message: 'gameSrc não fornecido.' });
    }
    const gameId = gameSrc.split('/').slice(-2, -1)[0];
    const FREE_PLAYS_LIMIT = 3;

    try {
        const { rows } = await db.query('SELECT role, subscription_type, subscription_end_date, free_plays_used FROM users WHERE id = $1', [req.session.userId]);
        const user = rows[0];

        if (!user) {
            return res.status(404).json({ message: 'Usuário da sessão não encontrado.' });
        }

        if (user.role === 'admin') {
            const playId = await recordPlay(req.session.userId, gameId, false);
            return res.json({ message: 'Início do jogo registrado', playId });
        }

        const isSubscriber = user.subscription_type !== 'none' && user.subscription_end_date && new Date(user.subscription_end_date) > new Date();

        if (isSubscriber) {
            const playId = await recordPlay(req.session.userId, gameId, false);
            return res.json({ message: 'Início do jogo registrado', playId });
        } else {
            if (user.free_plays_used < FREE_PLAYS_LIMIT) {
                await db.query('UPDATE users SET free_plays_used = free_plays_used + 1 WHERE id = $1', [req.session.userId]);
                const playId = await recordPlay(req.session.userId, gameId, true);
                return res.json({ message: 'Início do jogo registrado', playId });
            } else {
                return res.status(403).json({
                    message: `Você usou suas ${FREE_PLAYS_LIMIT} jogadas gratuitas. Assine para continuar jogando!`,
                    showSubscriptionModal: true
                });
            }
        }
    } catch (err) {
        console.error('Erro ao iniciar o jogo:', err);
        return res.status(500).json({ message: 'Erro no servidor ao iniciar o jogo.' });
    }
});

module.exports = router;