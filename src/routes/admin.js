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
<<<<<<< HEAD
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
=======

    // Função para envolver db.get em uma Promise
    const dbGet = (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    };

    // Função para envolver db.all em uma Promise
    const dbAll = (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    };

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = today.getTime();

        const queries = {
            totalUsers: dbGet('SELECT COUNT(id) as count FROM users'),
            newUsersToday: dbGet('SELECT COUNT(id) as count FROM users WHERE created_at >= ?', [todayTimestamp]),
            activeSubscriptions: dbGet('SELECT COUNT(id) as count FROM users WHERE subscription_type IS NOT NULL AND subscription_type != \'none\' AND subscription_end_date > ?', [Date.now()]),
            totalPlays: dbGet('SELECT COUNT(id) as count FROM game_plays'),
            topGames: dbAll('SELECT game_id, COUNT(game_id) as playCount FROM game_plays GROUP BY game_id ORDER BY playCount DESC LIMIT 5')
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
        console.error('Erro ao buscar estatísticas do admin:', error.message);
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
        res.status(500).json({ message: 'Erro no servidor ao buscar estatísticas.' });
    }
});

// Rota para dados de novos usuários por dia
router.get('/metrics/users/new-daily', async (req, res) => {
<<<<<<< HEAD
=======
    const dbAll = (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    };

>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
    try {
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        fourteenDaysAgo.setHours(0, 0, 0, 0);
        const fourteenDaysAgoTimestamp = fourteenDaysAgo.getTime();

<<<<<<< HEAD
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
=======
        const sql = `
            SELECT strftime('%Y-%m-%d', created_at / 1000, 'unixepoch') as date, COUNT(id) as count
            FROM users
            WHERE created_at >= ?
            GROUP BY date
            ORDER BY date ASC
        `;

        const rows = await dbAll(sql, [fourteenDaysAgoTimestamp]);
        res.json(rows);

    } catch (error) {
        console.error('Erro ao buscar métricas de novos usuários:', error.message);
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
        res.status(500).json({ message: 'Erro no servidor ao buscar métricas.' });
    }
});

// Rota para distribuição de planos de assinatura
router.get('/metrics/subscriptions/plan-distribution', async (req, res) => {
<<<<<<< HEAD
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
=======
    const dbAll = (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    };

    try {
        const sql = `
            SELECT subscription_type, COUNT(id) as count
            FROM users
            WHERE subscription_type IS NOT NULL AND subscription_type != 'none'
            GROUP BY subscription_type
        `;

        const rows = await dbAll(sql);
        res.json(rows);

    } catch (error) {
        console.error('Erro ao buscar distribuição de planos:', error.message);
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
        res.status(500).json({ message: 'Erro no servidor ao buscar métricas.' });
    }
});

// Rota para jogadas totais por dia
router.get('/metrics/games/total-plays', async (req, res) => {
<<<<<<< HEAD
=======
    const dbAll = (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    };

>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
    try {
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        fourteenDaysAgo.setHours(0, 0, 0, 0);
        const fourteenDaysAgoTimestamp = fourteenDaysAgo.getTime();

<<<<<<< HEAD
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
=======
        const sql = `
            SELECT strftime('%Y-%m-%d', start_time / 1000, 'unixepoch') as date, COUNT(id) as count
            FROM game_plays
            WHERE start_time >= ?
            GROUP BY date
            ORDER BY date ASC
        `;

        const rows = await dbAll(sql, [fourteenDaysAgoTimestamp]);
        res.json(rows);

    } catch (error) {
        console.error('Erro ao buscar métricas de jogadas totais:', error.message);
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
        res.status(500).json({ message: 'Erro no servidor ao buscar métricas.' });
    }
});

// Rota para tempo total de jogo por jogo
router.get('/metrics/games/play-time', async (req, res) => {
<<<<<<< HEAD
    try {
        const rows = await db('game_plays')
            .select('game_id')
            .sum('duration_seconds as total_duration')
            .groupBy('game_id');
=======
    const dbAll = (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    };

    try {
        const sql = `
            SELECT game_id, SUM(duration_seconds) as total_duration
            FROM game_plays
            GROUP BY game_id
        `;

        const rows = await dbAll(sql);
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec

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
<<<<<<< HEAD
        console.error('Erro ao buscar métricas de tempo de jogo:', error);
=======
        console.error('Erro ao buscar métricas de tempo de jogo:', error.message);
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
        res.status(500).json({ message: 'Erro no servidor ao buscar métricas.' });
    }
});

module.exports = router;
