const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database');
const fs = require('fs').promises;
const path = require('path');

// Rota para verificar status do usuário
router.get('/user-status', async (req, res) => {
    if (req.session.userId) {
        try {
            const { rows } = await db.query('SELECT username, subscription_type, role FROM users WHERE id = $1', [req.session.userId]);
            const user = rows[0];
            if (user) {
                res.json({ loggedIn: true, username: user.username, subscriptionType: user.subscription_type, role: user.role });
            } else {
                req.session.destroy(() => res.json({ loggedIn: false }));
            }
        } catch (err) {
            console.error('Erro ao buscar status do usuário:', err);
            res.status(500).json({ message: 'Erro no servidor.' });
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
        const { rows } = await db.query('SELECT username, email, subscription_type, subscription_end_date FROM users WHERE id = $1', [req.session.userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Erro ao buscar perfil:', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

// Rota para atualizar o perfil do usuário
router.put('/profile', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }
    const { username, email } = req.body;
    if (!username || !email) {
        return res.status(400).json({ message: 'Nome de usuário e e-mail são obrigatórios.' });
    }
    try {
        await db.query('UPDATE users SET username = $1, email = $2 WHERE id = $3', [username, email, req.session.userId]);
        res.json({ message: 'Perfil atualizado com sucesso!' });
    } catch (err) {
        if (err.code === '23505') { // Violação de unicidade no PostgreSQL
            return res.status(409).json({ message: 'Nome de usuário ou e-mail já existem.' });
        }
        console.error('Erro ao atualizar perfil:', err);
        res.status(500).json({ message: 'Erro ao atualizar o perfil.' });
    }
});

// Rota para deletar a conta do usuário
router.delete('/profile', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }
    try {
        await db.query('DELETE FROM users WHERE id = $1', [req.session.userId]);
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ message: 'Erro ao fazer logout após deletar a conta.' });
            }
            res.clearCookie('connect.sid');
            res.json({ message: 'Conta deletada com sucesso.' });
        });
    } catch (err) {
        console.error('Erro ao deletar conta:', err);
        res.status(500).json({ message: 'Erro ao deletar a conta.' });
    }
});

// Rota para mudar a senha do usuário
router.put('/profile/password', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias.' });
    }
    const saltRounds = 10;
    try {
        const { rows } = await db.query('SELECT password FROM users WHERE id = $1', [req.session.userId]);
        const user = rows[0];
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Senha atual incorreta.' });
        }
        const hash = await bcrypt.hash(newPassword, saltRounds);
        await db.query('UPDATE users SET password = $1 WHERE id = $2', [hash, req.session.userId]);
        res.json({ message: 'Senha atualizada com sucesso!' });
    } catch (err) {
        console.error('Erro ao mudar senha:', err);
        res.status(500).json({ message: 'Erro no servidor ao atualizar senha.' });
    }
});

// --- OUTRAS ROTAS DE USUÁRIO ---

// Rota para verificar o status da oferta de boas-vindas
router.get('/user/offer-status', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }
    try {
        const { rows } = await db.query('SELECT created_at FROM users WHERE id = $1', [req.session.userId]);
        if (rows.length === 0 || !rows[0].created_at) {
            return res.json({ offerActive: false });
        }
        const userCreationDate = new Date(rows[0].created_at);
        const offerEndDate = new Date(userCreationDate.getTime() + (7 * 24 * 60 * 60 * 1000));
        const now = new Date();
        if (now < offerEndDate) {
            res.json({ offerActive: true, offerEndDate: offerEndDate.getTime() });
        } else {
            res.json({ offerActive: false });
        }
    } catch (err) {
        res.status(500).json({ message: 'Erro ao verificar status da oferta.' });
    }
});

// Rota para obter o histórico de jogos do usuário
router.get('/user/play-history', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }
    try {
        const gamesPath = path.join(__dirname, '..', '..', 'public', 'games.json');
        const gamesData = await fs.readFile(gamesPath, 'utf8');
        const games = JSON.parse(gamesData);
        const gamesMap = new Map(games.map(game => [game.id, game]));

        const { rows } = await db.query('SELECT game_id, start_time FROM game_plays WHERE user_id = $1 ORDER BY start_time DESC', [req.session.userId]);
        
        const history = rows.map(row => {
            const gameDetails = gamesMap.get(row.game_id);
            return {
                game_id: row.game_id,
                title: gameDetails ? gameDetails.title : 'Jogo Desconhecido',
                thumbnail: gameDetails ? gameDetails.thumbnail : '',
                played_at: row.start_time
            };
        });
        res.json(history);
    } catch (error) {
        console.error('Erro ao processar o histórico:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Rotas para Favoritos
router.get('/user/favorites', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }
    try {
        const { rows } = await db.query("SELECT game_id FROM user_favorites WHERE user_id = $1", [req.session.userId]);
        res.json(rows.map(row => row.game_id));
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar favoritos.' });
    }
});

router.post('/user/favorites', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }
    const { game_id } = req.body;
    if (!game_id) {
        return res.status(400).json({ message: 'game_id é obrigatório.' });
    }
    try {
        await db.query("INSERT INTO user_favorites (user_id, game_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (user_id, game_id) DO NOTHING", [req.session.userId, game_id]);
        res.status(201).json({ message: 'Jogo favoritado com sucesso!' });
    } catch (err) {
        if (err.code === '23503') { // Foreign key violation
            return res.status(404).json({ message: 'Jogo ou usuário não encontrado.' });
        }
        res.status(500).json({ message: 'Erro ao favoritar o jogo.' });
    }
});

router.delete('/user/favorites/:game_id', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }
    const { game_id } = req.params;
    try {
        const result = await db.query("DELETE FROM user_favorites WHERE user_id = $1 AND game_id = $2", [req.session.userId, game_id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Favorito não encontrado.' });
        }
        res.status(200).json({ message: 'Favorito removido com sucesso!' });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao remover favorito.' });
    }
});

module.exports = router;
