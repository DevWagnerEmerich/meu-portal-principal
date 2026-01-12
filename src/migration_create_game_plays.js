module.exports = {
<<<<<<< HEAD
    up: async (db) => {
        const dbRun = (sql, params = []) => {
            return new Promise((resolve, reject) => {
                db.run(sql, params, function(err) {
                    if (err) reject(err);
                    resolve(this);
                });
            });
        };

        console.log('Iniciando migração: Criando a tabela game_plays...');

        try {
            await dbRun(`
                CREATE TABLE IF NOT EXISTS game_plays (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    game_id TEXT NOT NULL,
                    start_time INTEGER NOT NULL,
                    end_time INTEGER,
                    duration_seconds INTEGER,
                    is_free_trial INTEGER NOT NULL DEFAULT 0,
=======
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
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
            `);
            console.log('Tabela "game_plays" criada ou já existente.');
        } catch (error) {
            console.error('Erro ao criar a tabela game_plays:', error.message);
            throw error;
        }
    }
<<<<<<< HEAD
};
=======
};
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
