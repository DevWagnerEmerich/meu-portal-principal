const express = require('express');
const router = express.Router();
const db = require('../database');
const { isAdmin } = require('../middleware');
const fs = require('fs').promises;
const path = require('path');

// Rota de Emergência para Migração (Protegida por Secret) - DEVE ficar antes do isAdmin se quisermos rodar sem login (mas aqui o router todo tem isAdmin).
// Para rodar sem estar logado (já que o DB tá vazio e não tem admin), vamos abrir uma exceção ou mover para outro arquivo. 
// Mas como o router está protegido globalmente na linha 9, precisamos colocar ISSO ANTES da linha 9 ou criar um arquivo separado.
// Vamos injetar ANTES da proteção global.

// Rota de Migração SEM authenticação (protegida apenas por secret)
router.get('/migrate-db', async (req, res) => {
    const secret = req.query.secret;
    const expectedSecret = process.env.MIGRATION_SECRET || 'migracao-manual-emergencia';

    if (secret !== expectedSecret) {
        return res.status(403).json({ message: 'Acesso negado.' });
    }

    try {
        console.log('Iniciando migração manual de emergência...');
        await db.migrate.latest();
        console.log('Migração concluída.');
        res.json({ message: 'Migração executada com sucesso!' });
    } catch (error) {
        console.error('Erro na migração manual:', error);
        res.status(500).json({ message: 'Erro ao executar migração.', error: error.message });
    }
});

// Protege todas as rotas de admin ABAIXO desta linha
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

        // Mapear IDs dos jogos para nomes pelo Banco de Dados
        const gamesList = await db('games').select('id', 'title');
        const gamesMap = new Map(gamesList.map(game => [game.id, game.title]));

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

        // Mapear IDs dos jogos para nomes pelo DB
        const gamesList = await db('games').select('id', 'title');
        const gamesMap = new Map(gamesList.map(game => [game.id, game.title]));

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

// Rota para listar usuários (Admin)
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const offset = (page - 1) * limit;

        const query = db('users').select('id', 'username', 'email', 'role', 'subscription_type', 'created_at');

        if (search) {
            query.where(function () {
                this.where('username', 'like', `%${search}%`)
                    .orWhere('email', 'like', `%${search}%`);
            });
        }

        const data = await query.clone().limit(limit).offset(offset).orderBy('created_at', 'desc');
        const countResult = await query.clone().count('id as count').first();
        const total = parseInt(countResult.count || 0, 10);

        res.json({
            users: data,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error('Erro ao listar usuários:', err);
        res.status(500).json({ message: 'Erro ao listar usuários.' });
    }
});

// Rota para listar configurações
router.get('/settings', async (req, res) => {
    try {
        const settings = await db('system_settings').select('*');
        res.json(settings);
    } catch (err) {
        console.error('Erro ao buscar configurações:', err);
        res.status(500).json({ message: 'Erro ao buscar configurações.' });
    }
});

// Rota para atualizar configuração
router.put('/settings', async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key) return res.status(400).json({ message: 'Key é obrigatória.' });

        await db('system_settings')
            .where({ key })
            .update({ value: String(value), updated_at: new Date() }); // Armazena como string

        res.json({ message: 'Configuração atualizada.' });
    } catch (err) {
        console.error('Erro ao atualizar configuração:', err);
        res.status(500).json({ message: 'Erro ao atualizar configuração.' });
    }
});

// Rota para editar usuário (Admin)
router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { role, subscription_type, subscription_months } = req.body;

        const updates = {};
        if (role) updates.role = role;

        if (subscription_type) {
            updates.subscription_type = subscription_type;
            if (subscription_type === 'none') {
                updates.subscription_end_date = null;
            } else if (subscription_months) {
                const endDate = new Date();
                endDate.setMonth(endDate.getMonth() + parseInt(subscription_months));
                updates.subscription_end_date = endDate.getTime();
            }
        }

        const count = await db('users').where({ id }).update(updates);
        if (count === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });

        res.json({ message: 'Usuário atualizado com sucesso.' });
    } catch (err) {
        console.error('Erro ao atualizar usuário:', err);
        res.status(500).json({ message: 'Erro ao atualizar usuário.' });
    }
});

// Rota para deletar usuário (Admin)
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const count = await db('users').where({ id }).del();
        if (count === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });

        // Limpar dados relacionados se necessário (game_plays, sessions cascading usually handles it or manually)
        // Por segurança, vamos limpar game_plays
        await db('game_plays').where({ user_id: id }).del();

        res.json({ message: 'Usuário removido com sucesso.' });
    } catch (err) {
        console.error('Erro ao deletar usuário:', err);
        res.status(500).json({ message: 'Erro ao deletar usuário.' });
    }
});

module.exports = router;
