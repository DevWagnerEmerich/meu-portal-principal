module.exports = {
    up: async (client) => {
        console.log('Iniciando migração: migration_global_plays.js');
        try {
            // No PostgreSQL, a adição de coluna é mais segura e pode ser feita com IF NOT EXISTS
            // No entanto, uma abordagem mais simples é tentar adicionar e capturar o erro específico.
            await client.query("ALTER TABLE users ADD COLUMN free_plays_used INTEGER DEFAULT 0").catch(err => {
                if (err.code === '42701') { // 42701 é o código para 'duplicate column' no PostgreSQL
                    console.log('Coluna "free_plays_used" já existe na tabela "users".');
                } else {
                    throw err; // Re-lança outros erros
                }
            });
            console.log('Coluna "free_plays_used" verificada/adicionada à tabela "users".');

            // A sintaxe DROP TABLE IF EXISTS é padrão e funciona em PostgreSQL
            await client.query("DROP TABLE IF EXISTS user_free_plays");
            console.log('Tabela "user_free_plays" removida se existia.');

        } catch (error) {
            console.error('Erro na migração migration_global_plays.js:', error.message);
            throw error;
        }
    }
};
