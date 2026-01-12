module.exports = {
    up: async (client) => {
        console.log('Executando migração: migration_002_create_session_table.js (versão robusta)');
        // SQL Padrão e simplificado para a tabela de sessões
        await client.query(`
            CREATE TABLE IF NOT EXISTS "user_sessions" (
                "sid" varchar NOT NULL PRIMARY KEY,
                "sess" json NOT NULL,
                "expire" timestamp(6) NOT NULL
            );
        `);
        // A criação do índice é separada para garantir que não falhe se a tabela já existir
        await client.query(`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "user_sessions" ("expire");`);
        console.log('Tabela "user_sessions" e seu índice verificados/criados.');
    }
};