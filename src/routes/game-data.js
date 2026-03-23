const express = require('express');
const db = require('../database.js');
const router = express.Router();

/**
 * GET /api/game-data/:gameId/:key
 * Retrieves persisted data for a specific game and key for the logged-in user.
 */
router.get('/game-data/:gameId/:key', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autenticado.' });
    }

    const { gameId, key } = req.params;

    try {
        const row = await db('game_user_data')
            .where({
                user_id: req.session.userId,
                game_id: gameId,
                data_key: key
            })
            .first();

        if (!row) {
            return res.json({ value: null });
        }

        // Tenta parsear como JSON se possível
        let value = row.data_value;
        try {
            value = JSON.parse(value);
        } catch (e) {
            // Se não for JSON válido, retorna como string mesmo
        }

        res.json({ value });
    } catch (err) {
        console.error('Erro ao buscar game-data:', err);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

/**
 * GET /api/game-data/community/:gameId
 * Retrieves all public data (isPublic: true) for a specific game from all users.
 */
router.get('/game-data/community/:gameId', async (req, res) => {
    const { gameId } = req.params;

    try {
        const rows = await db('game_user_data')
            .join('users', 'game_user_data.user_id', 'users.id')
            .where({
                'game_user_data.game_id': gameId,
                'game_user_data.data_key': 'biblioteca'
            })
            .select('game_user_data.data_value', 'users.username');

        let allPublicItems = [];

        rows.forEach(row => {
            try {
                const data = JSON.parse(row.data_value);
                if (Array.isArray(data)) {
                    const publicItems = data
                        .filter(item => item.isPublic === true)
                        .map(item => ({
                            ...item,
                            authorName: row.username || 'Explorador'
                        }));
                    allPublicItems = allPublicItems.concat(publicItems);
                }
            } catch (e) {
                // Ignora erros de parse para dados individuais
            }
        });

        res.json(allPublicItems);
    } catch (err) {
        console.error('Erro ao buscar dados da comunidade:', err);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

/**
 * POST /api/game-data
 * Saves or updates persisted data for the logged-in user.
 */
router.post('/game-data', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autenticado.' });
    }

    const { gameId, key, value } = req.body;
    if (!gameId || !key) {
        return res.status(400).json({ message: 'gameId e key são obrigatórios.' });
    }

    const stringifiedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

    try {
        // Upsert manual (Knex onConflict para PostgreSQL)
        await db('game_user_data')
            .insert({
                user_id: req.session.userId,
                game_id: gameId,
                data_key: key,
                data_value: stringifiedValue,
                updated_at: new Date()
            })
            .onConflict(['user_id', 'game_id', 'data_key'])
            .merge({
                data_value: stringifiedValue,
                updated_at: new Date()
            });

        res.json({ success: true, message: 'Dados salvos com sucesso.' });
    } catch (err) {
        console.error('Erro ao salvar game-data:', err);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

module.exports = router;
