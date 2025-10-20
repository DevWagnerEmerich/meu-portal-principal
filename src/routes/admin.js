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
        res.status(500).json({ message: 'Erro no servidor ao buscar estatísticas.' });
    }
});

// Rota para dados de novos usuários por dia
router.get('/metrics/users/new-daily', async (req, res) => {
    const dbAll = (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    };

    try {
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        fourteenDaysAgo.setHours(0, 0, 0, 0);
        const fourteenDaysAgoTimestamp = fourteenDaysAgo.getTime();

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
        res.status(500).json({ message: 'Erro no servidor ao buscar métricas.' });
    }
});

// Rota para distribuição de planos de assinatura
router.get('/metrics/subscriptions/plan-distribution', async (req, res) => {
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
        res.status(500).json({ message: 'Erro no servidor ao buscar métricas.' });
    }
});

// Rota para jogadas totais por dia
router.get('/metrics/games/total-plays', async (req, res) => {
    const dbAll = (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    };

    try {
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        fourteenDaysAgo.setHours(0, 0, 0, 0);
        const fourteenDaysAgoTimestamp = fourteenDaysAgo.getTime();

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
        res.status(500).json({ message: 'Erro no servidor ao buscar métricas.' });
    }
});

// Rota para tempo total de jogo por jogo
router.get('/metrics/games/play-time', async (req, res) => {
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
        console.error('Erro ao buscar métricas de tempo de jogo:', error.message);
        res.status(500).json({ message: 'Erro no servidor ao buscar métricas.' });
    }
});

module.exports = router;
