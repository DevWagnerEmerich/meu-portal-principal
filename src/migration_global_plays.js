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

        console.log('Iniciando migração: migration_global_plays.js');

        try {
            // 1. Adicionar a coluna 'free_plays_used' à tabela 'users' se ela não existir
            await dbRun("ALTER TABLE users ADD COLUMN free_plays_used INTEGER DEFAULT 0").catch(err => {
                if (err.message.includes('duplicate column name')) {
                    console.log('Coluna "free_plays_used" já existe na tabela "users".');
                } else {
                    throw err; // Re-lança outros erros
                }
            });
            console.log('Coluna "free_plays_used" verificada/adicionada à tabela "users".');

            // 2. Remover a tabela 'user_free_plays' se ela existir
            await dbRun("DROP TABLE IF EXISTS user_free_plays");
            console.log('Tabela "user_free_plays" removida se existia.');

        } catch (error) {
            console.error('Erro na migração migration_global_plays.js:', error.message);
            throw error; // Rejeita a Promise para que run-migrations.js capture o erro
        }
    }
};