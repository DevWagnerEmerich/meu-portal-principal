const express = require('express');
const db = require('../database.js');
const fs = require('fs').promises;
const path = require('path');
const BusinessRules = require('../business-rules');

const router = express.Router();

// A rota para buscar os jogos mais acessados usava JSON files locais.
// Agora usa o DB fallback para prevenir problemas no Serverless (Vercel)
router.get('/games/most-accessed', async (req, res) => {
    try {
        const statsPath = path.join(__dirname, '..', 'data', 'game_access_stats.json');

        const [statsData, games] = await Promise.all([
            fs.readFile(statsPath, 'utf8').catch(() => '{}'),
            db('games').select('*')
        ]);

        const stats = JSON.parse(statsData);

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

    const { gameSrc, gameId: reqGameId } = req.body;
    if (!gameSrc) {
        return res.status(400).json({ message: 'gameSrc não fornecido.' });
    }
    const gameId = reqGameId || gameSrc.split('/').slice(-2, -1)[0];

    try {
        // Obter limite de jogadas e usuário
        const settings = await db('system_settings').where('key', 'free_plays_limit').first();
        const FREE_PLAYS_LIMIT = settings ? parseInt(settings.value, 10) : BusinessRules.FREE_PLAYS.LIMIT;

        const user = await db('users')
            .where('id', req.session.userId)
            .select('role', 'subscription_type', 'subscription_end_date', 'free_plays_used')
            .first();

        if (!user) {
            return res.status(500).json({ message: 'Erro ao buscar dados do usuário.' });
        }

        // Obter detalhes do jogo para verificar se é VIP/Premium
        const game = await db('games').where('id', gameId).first();
        if (!game && !reqGameId) {
            // Ignora erro se não tivermos informações do jogo ainda no slug
        }

        const isAdmin = user.role === 'admin';
        const isSubscriber = user.subscription_type !== 'none' && user.subscription_end_date > Date.now();

        const isGamePremium = game ? (game.is_premium || (game.category && game.category.toLowerCase().includes('vip'))) : false;

        // Se o jogo for VIP e o usuário não for VIP nem Admin, bloquear imediatamente
        if (isGamePremium && (!isSubscriber && !isAdmin)) {
            return res.status(403).json({
                message: 'Este jogo é exclusivo para assinantes VIP. Assine para liberar o acesso total!',
                showSubscriptionModal: true
            });
        }

        // O administrador tem acesso ilimitado
        if (isAdmin) {
            return await recordPlay(req.session.userId, gameId, false, res);
        }

        if (isSubscriber) {
            // Assinante pode jogar, apenas registra a jogada para estatísticas
            await recordPlay(req.session.userId, gameId, false, res);
        } else {
            // Usuário gratuito: Verificar jogadas HOJE
            // Contar jogadas "trial" feitas hoje
            // Para evitar problemas de fuso horário da Vercel (UTC) vs Brasil, subtraímos 3 horas,
            // e forçamos o cast para string para bater perfeitamente com o BigInt do PostgreSQL
            const today = new Date();
            // Subtrai 3 horas para alinhar com o horário de Brasília aproximadamente (se o servidor for UTC)
            if (today.getTimezoneOffset() === 0) {
                today.setHours(today.getHours() - 3);
            }
            today.setHours(0, 0, 0, 0);
            const startOfDayTimestamp = today.getTime().toString();

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

const { checkGameAccess, isAdmin } = require('../middleware.js');

// Rota pública para listar todos os jogos (substitui games.json)
router.get('/games', async (req, res) => {
    try {
        const games = await db('games')
            .select('*')
            .orderBy('is_featured', 'desc')
            .orderBy('title', 'asc');
        res.json(games);
    } catch (error) {
        console.error('Erro ao buscar jogos:', error);
        res.status(500).json({ message: 'Erro ao carregar jogos.' });
    }
});

// Rota pública para buscar um jogo específico pelo ID
router.get('/games/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const game = await db('games').where({ id }).first();

        if (!game) {
            return res.status(404).json({ message: 'Jogo não encontrado.' });
        }
        res.json(game);
    } catch (error) {
        console.error(`Erro ao buscar jogo ${req.params.id}:`, error);
        res.status(500).json({ message: 'Erro ao carregar o jogo.' });
    }
});

// Admin: Criar novo jogo
router.post('/games', isAdmin, async (req, res) => {
    try {
        const { id, title, description, thumbnail, game_url, printable_url, tutorial_url, category, is_premium, is_featured } = req.body;

        // Validação básica
        if (!id || !title || !game_url) {
            return res.status(400).json({ message: 'Campos obrigatórios: id, title, game_url.' });
        }

        const existing = await db('games').where({ id }).first();
        if (existing) {
            return res.status(409).json({ message: 'Já existe um jogo com este ID.' });
        }

        await db('games').insert({
            id, // slug
            title,
            description,
            thumbnail,
            game_url,
            printable_url,
            tutorial_url,
            category: category || 'Geral',
            is_premium: is_premium || false,
            is_featured: is_featured || false,
            updated_at: new Date()
        });

        res.status(201).json({ message: 'Jogo criado com sucesso.' });
    } catch (error) {
        console.error('Erro ao criar jogo:', error);
        res.status(500).json({ message: 'Erro ao criar jogo.' });
    }
});

// Admin: Atualizar jogo
router.put('/games/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        delete updates.id; // Não permite mudar ID/Slug

        updates.updated_at = new Date();

        const count = await db('games').where({ id }).update(updates);

        if (count === 0) {
            return res.status(404).json({ message: 'Jogo não encontrado.' });
        }

        res.json({ message: 'Jogo atualizado com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar jogo:', error);
        res.status(500).json({ message: 'Erro ao atualizar jogo.' });
    }
});

// Admin: Remover jogo
router.delete('/games/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const count = await db('games').where({ id }).del();

        if (count === 0) {
            return res.status(404).json({ message: 'Jogo não encontrado.' });
        }

        res.json({ message: 'Jogo removido com sucesso.' });
    } catch (error) {
        console.error('Erro ao remover jogo:', error);
        res.status(500).json({ message: 'Erro ao remover jogo.' });
    }
});

module.exports = router;
