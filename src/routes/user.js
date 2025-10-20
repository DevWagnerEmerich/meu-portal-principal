
const express = require('express');
const db = require('../database.js');

const router = express.Router();

// Rota para verificar status do usuário
router.get('/user-status', (req, res) => {
    if (req.session.userId) {
        db.get('SELECT username, subscription_type FROM users WHERE id = ?', [req.session.userId], (err, user) => {
            if (err) {
                console.error('Erro ao buscar dados do usuário:', err.message);
                return res.status(500).json({ message: 'Erro no servidor.' });
            }
            if (user) {
                res.json({
                    loggedIn: true,
                    username: user.username,
                    subscriptionType: user.subscription_type
                });
            } else {
                req.session.destroy(); // Clear invalid session
                res.json({ loggedIn: false });
            }
        });
    } else {
        res.json({ loggedIn: false });
    }
});

// Rota para obter dados do perfil do usuário
router.get('/profile', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }

    const sql = 'SELECT username, email, subscription_type, subscription_end_date FROM users WHERE id = ?';
    db.get(sql, [req.session.userId], (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Erro no servidor.' });
        }
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.json(user);
    });
});

// Rota para atualizar o perfil do usuário
router.put('/profile', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }

    const { username, email } = req.body;
    if (!username || !email) {
        return res.status(400).json({ message: 'Nome de usuário e e-mail são obrigatórios.' });
    }

    const sql = 'UPDATE users SET username = ?, email = ? WHERE id = ?';
    db.run(sql, [username, email, req.session.userId], function(err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
                return res.status(409).json({ message: 'Nome de usuário ou e-mail já existem.' });
            }
            return res.status(500).json({ message: 'Erro ao atualizar o perfil.' });
        }
        res.json({ message: 'Perfil atualizado com sucesso!' });
    });
});

// Rota para deletar a conta do usuário
router.delete('/profile', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }

    const sql = 'DELETE FROM users WHERE id = ?';
    db.run(sql, [req.session.userId], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Erro ao deletar a conta.' });
        }
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ message: 'Erro ao fazer logout após deletar a conta.' });
            }
            res.json({ message: 'Conta deletada com sucesso.' });
        });
    });
});



// Rota para mudar a senha do usuário
router.put('/profile/password', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias.' });
    }

    const saltRounds = 10; // Mesmo saltRounds usado no auth.js

    db.get('SELECT password FROM users WHERE id = ?', [req.session.userId], (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Erro no servidor.' });
        }
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Compara a senha atual fornecida com o hash armazenado
        bcrypt.compare(currentPassword, user.password, (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Erro ao comparar senhas.' });
            }
            if (!result) {
                return res.status(401).json({ message: 'Senha atual incorreta.' });
            }

            // Hashea a nova senha e atualiza no banco de dados
            bcrypt.hash(newPassword, saltRounds, (err, hash) => {
                if (err) {
                    return res.status(500).json({ message: 'Erro ao hashear nova senha.' });
                }

                db.run('UPDATE users SET password = ? WHERE id = ?', [hash, req.session.userId], function(err) {
                    if (err) {
                        return res.status(500).json({ message: 'Erro ao atualizar a senha.' });
                    }
                    res.json({ message: 'Senha atualizada com sucesso!' });
                });
            });
        });
    });
});

// Rota para verificar o status da oferta de boas-vindas
router.get('/user/offer-status', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }

    const sql = 'SELECT created_at FROM users WHERE id = ?';
    db.get(sql, [req.session.userId], (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Erro no servidor.' });
        }
        if (!user || !user.created_at) {
            // Se não houver data de criação, a oferta não se aplica
            return res.json({ offerActive: false });
        }

        const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
        const offerEndDate = user.created_at + sevenDaysInMillis;
        const now = Date.now();

        if (now < offerEndDate) {
            res.json({
                offerActive: true,
                offerEndDate: offerEndDate
            });
        } else {
            res.json({ offerActive: false });
        }
    });
});

const fs = require('fs').promises;
const path = require('path');

// Rota para obter o histórico de jogos do usuário
router.get('/user/play-history', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }

    try {
        // Caminho para o games.json
        const gamesPath = path.join(__dirname, '..', '..', 'public', 'games.json');
        
        // Lê o games.json
        const gamesData = await fs.readFile(gamesPath, 'utf8');
        const games = JSON.parse(gamesData);
        const gamesMap = new Map(games.map(game => [game.id, game]));

        // Busca o histórico no banco de dados
        const sql = `
            SELECT game_id, start_time
            FROM game_plays
            WHERE user_id = ?
            ORDER BY start_time DESC
        `;

        db.all(sql, [req.session.userId], (err, rows) => {
            if (err) {
                console.error('Erro ao buscar histórico de jogos:', err.message);
                return res.status(500).json({ message: 'Erro no servidor ao buscar histórico.' });
            }

            // Mapeia os resultados para incluir detalhes do jogo
            const history = rows.map(row => {
                const gameDetails = gamesMap.get(row.game_id);
                return {
                    game_id: row.game_id,
                    title: gameDetails ? gameDetails.title : 'Jogo Desconhecido',
                    thumbnail: gameDetails ? gameDetails.thumbnail : '/path/to/default/image.webp',
                    played_at: row.start_time
                };
            });

            res.json(history);
        });

    } catch (error) {
        console.error('Erro ao ler games.json ou processar o histórico:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Rotas para Favoritos

// GET: Listar favoritos de um usuário
router.get('/user/favorites', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }
    const sql = "SELECT game_id FROM user_favorites WHERE user_id = ?";
    db.all(sql, [req.session.userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao buscar favoritos.' });
        }
        res.json(rows.map(row => row.game_id));
    });
});

// POST: Adicionar um favorito
router.post('/user/favorites', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }
    const { game_id } = req.body;
    if (!game_id) {
        return res.status(400).json({ message: 'game_id é obrigatório.' });
    }
    const sql = "INSERT INTO user_favorites (user_id, game_id, created_at) VALUES (?, ?, ?)";
    db.run(sql, [req.session.userId, game_id, Date.now()], (err) => {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
                return res.status(409).json({ message: 'Jogo já favoritado.' });
            }
            return res.status(500).json({ message: 'Erro ao favoritar o jogo.' });
        }
        res.status(201).json({ message: 'Jogo favoritado com sucesso!' });
    });
});

// DELETE: Remover um favorito
router.delete('/user/favorites/:game_id', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }
    const { game_id } = req.params;
    const sql = "DELETE FROM user_favorites WHERE user_id = ? AND game_id = ?";
    db.run(sql, [req.session.userId, game_id], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Erro ao remover favorito.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Favorito não encontrado.' });
        }
        res.status(200).json({ message: 'Favorito removido com sucesso!' });
    });
});

module.exports = router;
