const express = require('express');
const db = require('../database.js');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// API to get the most accessed games
router.get('/games/most-accessed', async (req, res) => {
    try {
        const statsPath = path.join(__dirname, '..', 'data', 'game_access_stats.json');
        const gamesPath = path.join(__dirname, '..', '..', 'public', 'games.json');

        const [statsData, gamesData] = await Promise.all([
            fs.readFile(statsPath, 'utf8').catch(() => '{}'), // Return empty object on error
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

// API para iniciar uma sessão de jogo e registrar a jogada
router.post('/game-start', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const { gameSrc } = req.body;
    if (!gameSrc) {
        return res.status(400).json({ message: 'gameSrc não fornecido.' });
    }
    const gameId = gameSrc.split('/').slice(-2, -1)[0];
    const FREE_PLAYS_LIMIT = 3;

    db.get('SELECT role, subscription_type, subscription_end_date, free_plays_used FROM users WHERE id = ?', [req.session.userId], (err, user) => {
        if (err || !user) {
            return res.status(500).json({ message: 'Erro ao buscar dados do usuário.' });
        }

        // O administrador tem acesso ilimitado
        if (user.role === 'admin') {
            return recordPlay(req.session.userId, gameId, false, res);
        }

        const isSubscriber = user.subscription_type !== 'none' && user.subscription_end_date > Date.now();

        if (isSubscriber) {
            // Assinante pode jogar, apenas registra a jogada para estatísticas
            recordPlay(req.session.userId, gameId, false, res);
        } else {
            // Usuário gratuito, verifica o limite
            if (user.free_plays_used < FREE_PLAYS_LIMIT) {
                // Incrementa o contador e registra a jogada
                db.run('UPDATE users SET free_plays_used = free_plays_used + 1 WHERE id = ?', [req.session.userId], (updateErr) => {
                    if (updateErr) {
                        return res.status(500).json({ message: 'Erro ao atualizar contagem de jogadas.' });
                    }
                    recordPlay(req.session.userId, gameId, true, res);
                });
            } else {
                // Limite atingido
                return res.status(403).json({
                    message: `Você usou suas ${FREE_PLAYS_LIMIT} jogadas gratuitas. Assine para continuar jogando!`,
                    showSubscriptionModal: true
                });
            }
        }
    });
});

// Função auxiliar para registrar a jogada na tabela game_plays
function recordPlay(userId, gameId, isFreeTrial, res) {
    const startTime = Date.now();
    const logSql = 'INSERT INTO game_plays (user_id, game_id, start_time, is_free_trial) VALUES (?, ?, ?, ?)';
    db.run(logSql, [userId, gameId, startTime, isFreeTrial ? 1 : 0], function (logErr) {
        if (logErr) {
            console.error('Erro ao registrar na tabela game_plays:', logErr.message);
            return res.status(500).json({ message: 'Erro ao registrar log do jogo.' });
        }
        res.json({
            message: 'Início do jogo registrado',
            playId: this.lastID
        });
    });
}

// API para descontar tempo de jogo (polling)


module.exports = router;
