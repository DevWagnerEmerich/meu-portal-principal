module.exports = {
    // A função 'up' agora recebe o 'client' de conexão do pg
    up: async (client) => {
        console.log('Iniciando migração: Criando a tabela game_plays...');
        try {
            // Sintaxe do PostgreSQL: SERIAL PRIMARY KEY e TIMESTAMPTZ
            await client.query(`
                CREATE TABLE IF NOT EXISTS game_plays (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    game_id TEXT NOT NULL,
                    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    end_time TIMESTAMPTZ,
                    duration_seconds INTEGER,
                    is_free_trial BOOLEAN NOT NULL DEFAULT false,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
            `);
            console.log('Tabela "game_plays" criada ou já existente.');
        } catch (error) {
            console.error('Erro ao criar a tabela game_plays:', error.message);
            throw error;
        }
    }
};
