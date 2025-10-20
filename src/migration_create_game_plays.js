module.exports = {
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