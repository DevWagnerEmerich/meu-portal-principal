const express = require('express');
const db = require('../database.js');
const fs = require('fs').promises;
const path = require('path');
const BusinessRules = require('../business-rules');

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
            } else {
                // Limite atingido
                return res.status(403).json({
                    message: `Você já usou suas ${FREE_PLAYS_LIMIT} jogadas diárias gratuitas. Volte amanhã ou assine para continuar!`,
                    showSubscriptionModal: true
                });
            }
        }
    } catch (err) {
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
