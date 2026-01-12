const express = require('express');
const db = require('../database.js');
const fs = require('fs').promises;
const path = require('path');
const BusinessRules = require('../business-rules');

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

<<<<<<< HEAD
// API para iniciar uma sessão de jogo e registrar a jogada
=======
// Função auxiliar para registrar a jogada (convertida para async)
async function recordPlay(userId, gameId, isFreeTrial) {
    const startTime = new Date();
    const logSql = 'INSERT INTO game_plays (user_id, game_id, start_time, is_free_trial) VALUES ($1, $2, $3, $4) RETURNING id';
    const { rows } = await db.query(logSql, [userId, gameId, startTime, isFreeTrial]);
    return rows[0].id;
}

// API para iniciar uma sessão de jogo (convertida para async)
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
router.post('/game-start', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const { gameSrc } = req.body;
    if (!gameSrc) {
        return res.status(400).json({ message: 'gameSrc não fornecido.' });
    }
    const gameId = gameSrc.split('/').slice(-2, -1)[0];
    const FREE_PLAYS_LIMIT = BusinessRules.FREE_PLAYS.LIMIT;

    try {
<<<<<<< HEAD
        const user = await db('users')
            .where('id', req.session.userId)
            .select('role', 'subscription_type', 'subscription_end_date', 'free_plays_used')
            .first();

        if (!user) {
            return res.status(500).json({ message: 'Erro ao buscar dados do usuário.' });
        }

        // O administrador tem acesso ilimitado
        if (user.role === 'admin') {
            return await recordPlay(req.session.userId, gameId, false, res);
        }

        const isSubscriber = user.subscription_type !== 'none' && user.subscription_end_date > Date.now();

        if (isSubscriber) {
            // Assinante pode jogar, apenas registra a jogada para estatísticas
            await recordPlay(req.session.userId, gameId, false, res);
        } else {
            // Usuário gratuito: Verificar jogadas HOJE
            // Definir início do dia (00:00:00)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startOfDayTimestamp = today.getTime();

            // Contar jogadas "trial" feitas hoje
            // Nota: SQLite armazena datas como números ou texto, Postgres como timestamp ou bigint
            // Aqui estamos assumindo que start_time é salvo como BigInteger (timestamp em ms) no Knex
            const result = await db('game_plays')
                .where('user_id', req.session.userId)
                .andWhere('is_free_trial', 1)
                .andWhere('start_time', '>=', startOfDayTimestamp)
                .count('id as count')
                .first();

            // Tratamento para variações de retorno do Knex (string vs number)
            const playsToday = parseInt(result.count || 0, 10);

            if (playsToday < FREE_PLAYS_LIMIT) {
                // Registra a jogada (isso vai aumentar a contagem na próxima verificação)
                await recordPlay(req.session.userId, gameId, true, res);
=======
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
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
            } else {
                return res.status(403).json({
                    message: `Você já usou suas ${FREE_PLAYS_LIMIT} jogadas diárias gratuitas. Volte amanhã ou assine para continuar!`,
                    showSubscriptionModal: true
                });
            }
        }
    } catch (err) {
<<<<<<< HEAD
        console.error('Erro na lógica de início de jogo:', err);
        return res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// Função auxiliar para registrar a jogada na tabela game_plays
async function recordPlay(userId, gameId, isFreeTrial, res) {
    const startTime = Date.now();
    try {
        const [result] = await db('game_plays').insert({
            user_id: userId,
            game_id: gameId,
            start_time: startTime,
            is_free_trial: isFreeTrial ? 1 : 0
        }).returning('id');

        const playId = (result && typeof result === 'object') ? result.id : result;

        res.json({
            message: 'Início do jogo registrado',
            playId: playId
        });
    } catch (logErr) {
        console.error('Erro ao registrar na tabela game_plays:', logErr);
        // Não falhamos a requisição principal se o log falhar, mas logamos o erro
        // Ou falhamos? Melhor retornar erro para consistência.
        return res.status(500).json({ message: 'Erro ao registrar log do jogo.' });
    }
}

module.exports = router;
=======
        console.error('Erro ao iniciar o jogo:', err);
        return res.status(500).json({ message: 'Erro no servidor ao iniciar o jogo.' });
    }
});

module.exports = router;
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
