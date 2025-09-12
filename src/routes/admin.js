const express = require('express');
const router = express.Router();
const db = require('../database');
const { isAdmin } = require('../middleware'); // Import the isAdmin middleware

// Protect all admin routes with isAdmin middleware
router.use(isAdmin);

// Example Admin Metrics Route: Get total users
router.get('/metrics/users/total', (req, res) => {
    db.get('SELECT COUNT(*) AS totalUsers FROM users', (err, row) => {
        if (err) {
            console.error('Erro ao buscar total de usuários:', err.message);
            return res.status(500).json({ message: 'Falha ao buscar total de usuários.' });
        }
        res.json({ totalUsers: row.totalUsers });
    });
});

// Add more metrics routes here as per the plan

// Admin Metrics Route: New registrations per day (last N days)
router.get('/metrics/users/new-daily', (req, res) => {
    const days = req.query.days || 30; // Default to last 30 days
    const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000); // Calculate timestamp for cutoff

    db.all(`
        SELECT
            strftime('%Y-%m-%d', datetime(created_at / 1000, 'unixepoch')) AS date,
            COUNT(*) AS newRegistrations
        FROM users
        WHERE created_at >= ?
        GROUP BY date
        ORDER BY date ASC
    `, [cutoffDate], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar novos registros diários:', err.message);
            return res.status(500).json({ message: 'Falha ao buscar novos registros diários.' });
        }
        res.json(rows);
    });
});

// Admin Metrics Route: Number of active users (logged in within last 24 hours)
router.get('/metrics/users/active', (req, res) => {
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

    db.get('SELECT COUNT(*) AS activeUsers FROM users WHERE last_login_date >= ?', [twentyFourHoursAgo], (err, row) => {
        if (err) {
            console.error('Erro ao buscar usuários ativos:', err.message);
            return res.status(500).json({ message: 'Falha ao buscar usuários ativos.' });
        }
        res.json({ activeUsers: row.activeUsers });
    });
});

// Admin Metrics Route: Total number of game plays across all games
router.get('/metrics/games/total-plays', (req, res) => {
    db.get('SELECT COUNT(*) AS totalPlays FROM game_plays', (err, row) => {
        if (err) {
            console.error('Erro ao buscar total de jogadas:', err.message);
            return res.status(500).json({ message: 'Falha ao buscar total de jogadas.' });
        }
        res.json({ totalPlays: row.totalPlays });
    });
});

// Admin Metrics Route: Top N most played games
router.get('/metrics/games/top-played', (req, res) => {
    const limit = req.query.limit || 5; // Default to top 5
    db.all(`
        SELECT game_id, COUNT(*) AS playCount
        FROM game_plays
        GROUP BY game_id
        ORDER BY playCount DESC
        LIMIT ?
    `, [limit], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar jogos mais jogados:', err.message);
            return res.status(500).json({ message: 'Falha ao buscar jogos mais jogados.' });
        }
        res.json(rows);
    });
});

// Admin Metrics Route: Average/total play time per game
router.get('/metrics/games/play-time', (req, res) => {
    db.all(`
        SELECT game_id, SUM(duration_seconds) AS totalPlayTime, AVG(duration_seconds) AS averagePlayTime
        FROM game_plays
        GROUP BY game_id
    `, (err, rows) => {
        if (err) {
            console.error('Erro ao buscar tempo de jogo:', err.message);
            return res.status(500).json({ message: 'Falha ao buscar tempo de jogo.' });
        }
        res.json(rows);
    });
});

// Admin Metrics Route: Free trial usage
router.get('/metrics/games/free-trial-usage', (req, res) => {
    db.all(`
        SELECT game_id, COUNT(*) AS freeTrialPlays
        FROM game_plays
        WHERE is_free_trial = 1
        GROUP BY game_id
        ORDER BY freeTrialPlays DESC
    `, (err, rows) => {
        if (err) {
            console.error('Erro ao buscar uso do período gratuito:', err.message);
            return res.status(500).json({ message: 'Falha ao buscar uso do período gratuito.' });
        }
        res.json(rows);
    });
});

// Admin Metrics Route: Total number of active subscriptions
router.get('/metrics/subscriptions/total', (req, res) => {
    db.get('SELECT COUNT(*) AS totalSubscriptions FROM users WHERE subscription_type != \'none\'', (err, row) => {
        if (err) {
            console.error('Erro ao buscar total de assinaturas:', err.message);
            return res.status(500).json({ message: 'Falha ao buscar total de assinaturas.' });
        }
        res.json({ totalSubscriptions: row.totalSubscriptions });
    });
});

// Admin Metrics Route: New subscriptions per day
router.get('/metrics/subscriptions/new-daily', (req, res) => {
    const days = req.query.days || 30; // Default to last 30 days
    const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);

    // Assuming 'created_at' in users table can indicate subscription start for 'none' to 'active' transition
    // A more robust solution would involve a dedicated 'subscriptions' table with start dates
    db.all(`
        SELECT
            strftime('%Y-%m-%d', datetime(created_at / 1000, 'unixepoch')) AS date,
            COUNT(*) AS newSubscriptions
        FROM users
        WHERE subscription_type != 'none' AND created_at >= ?
        GROUP BY date
        ORDER BY date ASC
    `, [cutoffDate], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar novas assinaturas diárias:', err.message);
            return res.status(500).json({ message: 'Falha ao buscar novas assinaturas diárias.' });
        }
        res.json(rows);
    });
});

// Admin Metrics Route: Total revenue generated (monthly/yearly)
// This is a simplified calculation based on current active subscriptions.
// A real revenue metric would require logging payment transactions.
router.get('/metrics/subscriptions/revenue', (req, res) => {
    // Assuming fixed prices for simplicity, as per subscription options modal
    const monthlyPrice = 19;
    const semiannualPrice = 99;
    const annualPrice = 179;

    db.all('SELECT subscription_type, COUNT(*) AS count FROM users WHERE subscription_type != \'none\' GROUP BY subscription_type', (err, rows) => {
        if (err) {
            console.error('Erro ao buscar dados de receita:', err.message);
            return res.status(500).json({ message: 'Falha ao buscar dados de receita.' });
        }

        let totalRevenue = 0;
        rows.forEach(row => {
            if (row.subscription_type === 'monthly') {
                totalRevenue += row.count * monthlyPrice;
            } else if (row.subscription_type === 'semiannual') {
                totalRevenue += row.count * semiannualPrice;
            } else if (row.subscription_type === 'annual') {
                totalRevenue += row.count * annualPrice;
            }
        });
        res.json({ totalRevenue: totalRevenue });
    });
});

// Admin Metrics Route: Breakdown of subscriptions by plan type
router.get('/metrics/subscriptions/plan-distribution', (req, res) => {
    db.all('SELECT subscription_type, COUNT(*) AS count FROM users GROUP BY subscription_type', (err, rows) => {
        if (err) {
            console.error('Erro ao buscar distribuição de planos:', err.message);
            return res.status(500).json({ message: 'Falha ao buscar distribuição de planos.' });
        }
        res.json(rows);
    });
});

module.exports = router;
