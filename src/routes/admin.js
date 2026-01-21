const express = require('express');
const router = express.Router();
const db = require('../database');
const { isAdmin } = require('../middleware');
const fs = require('fs').promises;
const path = require('path');

// Protege todas as rotas de admin
router.use(isAdmin);

// Rota consolidada para buscar todas as estatísticas do dashboard
router.get('/stats', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = today.getTime();

        const queries = {
            totalUsers: db('users').count('id as count').first(),
            newUsersToday: db('users').where('created_at', '>=', todayTimestamp).count('id as count').first(),
            activeSubscriptions: db('users')
                .whereNotNull('subscription_type')
                .whereNot('subscription_type', 'none')
                .where('subscription_end_date', '>', Date.now())
                .count('id as count').first(),
            totalPlays: db('game_plays').count('id as count').first(),
            topGames: db('game_plays')
                .select('game_id')
                .count('game_id as playCount')
                .groupBy('game_id')
                .orderBy('playCount', 'desc')
                .limit(5)
        };

        const [totalUsers, newUsersToday, activeSubscriptions, totalPlays, topGames] = await Promise.all(Object.values(queries));

        // Mapear IDs dos jogos para nomes
        const gamesPath = path.join(__dirname, '..', '..', 'public', 'games.json');
        const gamesData = await fs.readFile(gamesPath, 'utf8');
        const games = JSON.parse(gamesData);
        const gamesMap = new Map(games.map(game => [game.id, game.title]));

        const topGamesWithNames = topGames.map(game => ({
            ...game,
            title: gamesMap.get(game.game_id) || 'Jogo Desconhecido'
        }));

        res.json({
            totalUsers: totalUsers.count,
            newUsersToday: newUsersToday.count,
            activeSubscriptions: activeSubscriptions.count,
            totalPlays: totalPlays.count,
            topGames: topGamesWithNames
        });

    } catch (error) {
        console.error('Erro ao buscar estatísticas do admin:', error);
        res.status(500).json({ message: 'Erro no servidor ao buscar estatísticas.' });
    }
});

// Rota para dados de novos usuários por dia
router.get('/metrics/users/new-daily', async (req, res) => {
    try {
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        fourteenDaysAgo.setHours(0, 0, 0, 0);
        const fourteenDaysAgoTimestamp = fourteenDaysAgo.getTime();

        // Nota: date formatting usando strftime é específico do SQLite.
        // Se migrarmos para Postgres, isso precisa mudar para to_char ou date_trunc.
        // O knex.raw ajuda, mas não abstrai tudo. Para ser "database agnostic", teríamos que processar em JS ou usar helper.
        // Por hora, manterei sqlite compatível, mas ciente da dívida técnica para Postgres.

        let sqlRaw;
        const client = db.client.config.client;

        if (client === 'pg') {
            sqlRaw = "to_char(to_timestamp(created_at / 1000), 'YYYY-MM-DD') as date";
        } else {
            sqlRaw = "strftime('%Y-%m-%d', created_at / 1000, 'unixepoch') as date";
        }

        const rows = await db('users')
            .select(db.raw(sqlRaw))
            .count('id as count')
            .where('created_at', '>=', fourteenDaysAgoTimestamp)
            .groupBy('date')
            .orderBy('date', 'asc');

        res.json(rows);

    } catch (error) {
        console.error('Erro ao buscar métricas de novos usuários:', error);
        res.status(500).json({ message: 'Erro no servidor ao buscar métricas.' });
    }
});

// Rota para distribuição de planos de assinatura
router.get('/metrics/subscriptions/plan-distribution', async (req, res) => {
    try {
        const rows = await db('users')
            .select('subscription_type')
            .count('id as count')
            .whereNotNull('subscription_type')
            .whereNot('subscription_type', 'none')
            .groupBy('subscription_type');

        res.json(rows);

    } catch (error) {
        console.error('Erro ao buscar distribuição de planos:', error);
        res.status(500).json({ message: 'Erro no servidor ao buscar métricas.' });
    }
});

// Rota para jogadas totais por dia
router.get('/metrics/games/total-plays', async (req, res) => {
    try {
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        fourteenDaysAgo.setHours(0, 0, 0, 0);
        const fourteenDaysAgoTimestamp = fourteenDaysAgo.getTime();

        let sqlRaw;
        const client = db.client.config.client;
        if (client === 'pg') {
            sqlRaw = "to_char(to_timestamp(start_time / 1000), 'YYYY-MM-DD') as date";
        } else {
            sqlRaw = "strftime('%Y-%m-%d', start_time / 1000, 'unixepoch') as date";
        }

        const rows = await db('game_plays')
            .select(db.raw(sqlRaw))
            .count('id as count')
            .where('start_time', '>=', fourteenDaysAgoTimestamp)
            .groupBy('date')
            .orderBy('date', 'asc');

        res.json(rows);

    } catch (error) {
        console.error('Erro ao buscar métricas de jogadas totais:', error);
        res.status(500).json({ message: 'Erro no servidor ao buscar métricas.' });
    }
});

// Rota para tempo total de jogo por jogo
router.get('/metrics/games/play-time', async (req, res) => {
    try {
        const rows = await db('game_plays')
            .select('game_id')
            .sum('duration_seconds as total_duration')
            .groupBy('game_id');

        // Mapear IDs dos jogos para nomes
        const gamesPath = path.join(__dirname, '..', '..', 'public', 'games.json');
        const gamesData = await fs.readFile(gamesPath, 'utf8');
        const games = JSON.parse(gamesData);
        const gamesMap = new Map(games.map(game => [game.id, game.title]));

        const resultsWithNames = rows.map(row => ({
            title: gamesMap.get(row.game_id) || 'Jogo Desconhecido',
            total_duration_minutes: Math.round(row.total_duration / 60)
        }));

        res.json(resultsWithNames);

    } catch (error) {
        console.error('Erro ao buscar métricas de tempo de jogo:', error);
        res.status(500).json({ message: 'Erro no servidor ao buscar métricas.' });
    }
});

module.exports = router;
