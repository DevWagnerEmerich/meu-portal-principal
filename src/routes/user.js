const express = require('express');
<<<<<<< HEAD
const db = require('../database.js');
const bcrypt = require('bcrypt'); // Added missing require

=======
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database');
const fs = require('fs').promises;
const path = require('path');

// Rota para verificar status do usuário
router.get('/user-status', async (req, res) => {
    if (req.session.userId) {
        try {
<<<<<<< HEAD
            const user = await db('users')
                .where('id', req.session.userId)
                .select('username', 'subscription_type', 'created_at')
                .first();

            if (user) {
                // Calcular energia diária
                const BusinessRules = require('../business-rules');
                const LIMIT = BusinessRules.FREE_PLAYS.LIMIT;

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const startOfDayTimestamp = today.getTime();

                const playsResult = await db('game_plays')
                    .where('user_id', req.session.userId)
                    .andWhere('is_free_trial', 1)
                    .andWhere('start_time', '>=', startOfDayTimestamp)
                    .count('id as count')
                    .first();

                const playsUsed = parseInt(playsResult.count || 0, 10);
                const energy = Math.max(0, LIMIT - playsUsed);

                // Calcular status da oferta de boas-vindas
                let offerActive = false;
                let offerExpiresAt = null;
                if (user.created_at) {
                    const createdAtTime = new Date(Number(user.created_at)).getTime();
                    const offerDuration = BusinessRules.WELCOME_OFFER.DURATION_DAYS * 24 * 60 * 60 * 1000;
                    offerExpiresAt = createdAtTime + offerDuration;
                    if (Date.now() < offerExpiresAt) {
                        offerActive = true;
                    }
                }

                res.json({
                    loggedIn: true,
                    username: user.username,
                    subscriptionType: user.subscription_type,
                    energy: energy,
                    maxEnergy: LIMIT,
                    welcomeOffer: {
                        active: offerActive,
                        expiresAt: offerExpiresAt
                    }
                });
=======
            const { rows } = await db.query('SELECT username, subscription_type, role FROM users WHERE id = $1', [req.session.userId]);
            const user = rows[0];
            if (user) {
                res.json({ loggedIn: true, username: user.username, subscriptionType: user.subscription_type, role: user.role });
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
            } else {
                req.session.destroy(() => res.json({ loggedIn: false }));
            }
        } catch (err) {
<<<<<<< HEAD
            console.error('Erro ao buscar dados do usuário:', err);
            return res.status(500).json({ message: 'Erro no servidor.' });
=======
            console.error('Erro ao buscar status do usuário:', err);
            res.status(500).json({ message: 'Erro no servidor.' });
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
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
<<<<<<< HEAD

    try {
        const user = await db('users')
            .where('id', req.session.userId)
            .select('username', 'email', 'subscription_type', 'subscription_end_date')
            .first();

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.json(user);
    } catch (err) {
        return res.status(500).json({ message: 'Erro no servidor.' });
=======
    try {
        const { rows } = await db.query('SELECT username, email, subscription_type, subscription_end_date FROM users WHERE id = $1', [req.session.userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Erro ao buscar perfil:', err);
        res.status(500).json({ message: 'Erro no servidor.' });
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
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
<<<<<<< HEAD

    try {
        await db('users')
            .where('id', req.session.userId)
            .update({ username, email });

        res.json({ message: 'Perfil atualizado com sucesso!' });
    } catch (err) {
        // SQLITE_CONSTRAINT
        if (err.code === 'SQLITE_CONSTRAINT' || (err.message && err.message.includes('unique'))) {
            return res.status(409).json({ message: 'Nome de usuário ou e-mail já existem.' });
        }
        return res.status(500).json({ message: 'Erro ao atualizar o perfil.' });
=======
    try {
        await db.query('UPDATE users SET username = $1, email = $2 WHERE id = $3', [username, email, req.session.userId]);
        res.json({ message: 'Perfil atualizado com sucesso!' });
    } catch (err) {
        if (err.code === '23505') { // Violação de unicidade no PostgreSQL
            return res.status(409).json({ message: 'Nome de usuário ou e-mail já existem.' });
        }
        console.error('Erro ao atualizar perfil:', err);
        res.status(500).json({ message: 'Erro ao atualizar o perfil.' });
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
    }
});

// Rota para deletar a conta do usuário
router.delete('/profile', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }
<<<<<<< HEAD

    try {
        await db('users').where('id', req.session.userId).del();

=======
    try {
        await db.query('DELETE FROM users WHERE id = $1', [req.session.userId]);
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ message: 'Erro ao fazer logout após deletar a conta.' });
            }
            res.clearCookie('connect.sid');
            res.json({ message: 'Conta deletada com sucesso.' });
        });
    } catch (err) {
<<<<<<< HEAD
        return res.status(500).json({ message: 'Erro ao deletar a conta.' });
=======
        console.error('Erro ao deletar conta:', err);
        res.status(500).json({ message: 'Erro ao deletar a conta.' });
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
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
<<<<<<< HEAD

    const saltRounds = 10;

    try {
        const user = await db('users').where('id', req.session.userId).select('password').first();

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

=======
    const saltRounds = 10;
    try {
        const { rows } = await db.query('SELECT password FROM users WHERE id = $1', [req.session.userId]);
        const user = rows[0];
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Senha atual incorreta.' });
        }
<<<<<<< HEAD

        const hash = await bcrypt.hash(newPassword, saltRounds);
        await db('users').where('id', req.session.userId).update({ password: hash });

        res.json({ message: 'Senha atualizada com sucesso!' });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao atualizar a senha.' });
=======
        const hash = await bcrypt.hash(newPassword, saltRounds);
        await db.query('UPDATE users SET password = $1 WHERE id = $2', [hash, req.session.userId]);
        res.json({ message: 'Senha atualizada com sucesso!' });
    } catch (err) {
        console.error('Erro ao mudar senha:', err);
        res.status(500).json({ message: 'Erro no servidor ao atualizar senha.' });
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
    }
});

// --- OUTRAS ROTAS DE USUÁRIO ---

// Rota para verificar o status da oferta de boas-vindas
router.get('/user/offer-status', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }
<<<<<<< HEAD

    try {
        const user = await db('users').where('id', req.session.userId).select('created_at').first();

        if (!user || !user.created_at) {
=======
    try {
        const { rows } = await db.query('SELECT created_at FROM users WHERE id = $1', [req.session.userId]);
        if (rows.length === 0 || !rows[0].created_at) {
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
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
<<<<<<< HEAD
        return res.status(500).json({ message: 'Erro no servidor.' });
    }
});

const fs = require('fs').promises;
const path = require('path');

=======
        res.status(500).json({ message: 'Erro ao verificar status da oferta.' });
    }
});

>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
// Rota para obter o histórico de jogos do usuário
router.get('/user/play-history', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }
<<<<<<< HEAD

=======
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
    try {
        const gamesPath = path.join(__dirname, '..', '..', 'public', 'games.json');
        const gamesData = await fs.readFile(gamesPath, 'utf8');
        const games = JSON.parse(gamesData);
        const gamesMap = new Map(games.map(game => [game.id, game]));

<<<<<<< HEAD
        const rows = await db('game_plays')
            .where('user_id', req.session.userId)
            .select('game_id', 'start_time')
            .orderBy('start_time', 'desc');

=======
        const { rows } = await db.query('SELECT game_id, start_time FROM game_plays WHERE user_id = $1 ORDER BY start_time DESC', [req.session.userId]);
        
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
        const history = rows.map(row => {
            const gameDetails = gamesMap.get(row.game_id);
            return {
                game_id: row.game_id,
                title: gameDetails ? gameDetails.title : 'Jogo Desconhecido',
<<<<<<< HEAD
                thumbnail: gameDetails ? gameDetails.thumbnail : '/path/to/default/image.webp',
                played_at: row.start_time
            };
        });

        res.json(history);

    } catch (error) {
        console.error('Erro ao ler games.json ou processar o histórico:', error);
=======
                thumbnail: gameDetails ? gameDetails.thumbnail : '',
                played_at: row.start_time
            };
        });
        res.json(history);
    } catch (error) {
        console.error('Erro ao processar o histórico:', error);
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Rotas para Favoritos
<<<<<<< HEAD

// GET: Listar favoritos de um usuário
=======
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
router.get('/user/favorites', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }
    try {
<<<<<<< HEAD
        const rows = await db('user_favorites').where('user_id', req.session.userId).select('game_id');
        res.json(rows.map(row => row.game_id));
    } catch (err) {
        return res.status(500).json({ message: 'Erro ao buscar favoritos.' });
    }
});

// POST: Adicionar um favorito
=======
        const { rows } = await db.query("SELECT game_id FROM user_favorites WHERE user_id = $1", [req.session.userId]);
        res.json(rows.map(row => row.game_id));
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar favoritos.' });
    }
});

>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
router.post('/user/favorites', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }
    const { game_id } = req.body;
    if (!game_id) {
        return res.status(400).json({ message: 'game_id é obrigatório.' });
    }
    try {
<<<<<<< HEAD
        await db('user_favorites').insert({
            user_id: req.session.userId,
            game_id,
            created_at: Date.now()
        });
        res.status(201).json({ message: 'Jogo favoritado com sucesso!' });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT' || (err.message && err.message.includes('unique'))) {
            return res.status(409).json({ message: 'Jogo já favoritado.' });
        }
        return res.status(500).json({ message: 'Erro ao favoritar o jogo.' });
    }
});

// DELETE: Remover um favorito
=======
        await db.query("INSERT INTO user_favorites (user_id, game_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (user_id, game_id) DO NOTHING", [req.session.userId, game_id]);
        res.status(201).json({ message: 'Jogo favoritado com sucesso!' });
    } catch (err) {
        if (err.code === '23503') { // Foreign key violation
            return res.status(404).json({ message: 'Jogo ou usuário não encontrado.' });
        }
        res.status(500).json({ message: 'Erro ao favoritar o jogo.' });
    }
});

>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
router.delete('/user/favorites/:game_id', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }
    const { game_id } = req.params;
    try {
<<<<<<< HEAD
        const deletedCount = await db('user_favorites')
            .where('user_id', req.session.userId)
            .where('game_id', game_id)
            .del();

        if (deletedCount === 0) {
=======
        const result = await db.query("DELETE FROM user_favorites WHERE user_id = $1 AND game_id = $2", [req.session.userId, game_id]);
        if (result.rowCount === 0) {
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
            return res.status(404).json({ message: 'Favorito não encontrado.' });
        }
        res.status(200).json({ message: 'Favorito removido com sucesso!' });
    } catch (err) {
<<<<<<< HEAD
        return res.status(500).json({ message: 'Erro ao remover favorito.' });
=======
        res.status(500).json({ message: 'Erro ao remover favorito.' });
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
    }
});

module.exports = router;
