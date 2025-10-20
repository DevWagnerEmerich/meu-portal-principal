module.exports = {
    up: async (client) => {
        console.log('Iniciando migração: migration_20250912.js (simplificada para PostgreSQL)');

        try {
            // 1. Remover a coluna 'daily_time_left' da tabela 'users', se ela existir.
            // O PostgreSQL suporta DROP COLUMN diretamente, o que é muito mais limpo.
            await client.query(`ALTER TABLE users DROP COLUMN IF EXISTS daily_time_left;`);
            console.log('Coluna "daily_time_left" removida da tabela "users" (se existia).');

            // 2. Criar a tabela 'user_favorites' (movida de database.js para uma migração)
            // A tabela 'user_free_plays' foi descontinuada na migração 'migration_global_plays.js'
            await client.query(`
                CREATE TABLE IF NOT EXISTS user_favorites (
                    user_id INTEGER NOT NULL,
                    game_id TEXT NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    PRIMARY KEY (user_id, game_id),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
            `);
            console.log('Tabela "user_favorites" criada ou já existente.');

            // 3. Criar outras tabelas que estavam em database.js
            await client.query(`
                CREATE TABLE IF NOT EXISTS email_confirmations (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER,
                    token TEXT UNIQUE,
                    expires_at BIGINT, -- Usando BIGINT para armazenar timestamp em milissegundos
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
            `);
            console.log('Tabela "email_confirmations" criada ou já existente.');

            await client.query(`
                CREATE TABLE IF NOT EXISTS password_resets (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER,
                    token TEXT UNIQUE,
                    expires_at BIGINT,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
            `);
            console.log('Tabela "password_resets" criada ou já existente.');

            // 4. A tabela users agora deve ser criada primeiro, antes de qualquer outra coisa.
            // Esta migração assume que uma migração inicial já criou a tabela users.
            // Para robustez, vamos adicionar a criação da tabela users aqui também, com IF NOT EXISTS.
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username TEXT UNIQUE,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT,
                    google_id TEXT UNIQUE,
                    is_confirmed BOOLEAN DEFAULT false,
                    subscription_type TEXT DEFAULT 'none',
                    subscription_end_date TIMESTAMPTZ,
                    last_login_date TIMESTAMPTZ,
                    role TEXT DEFAULT 'user',
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
            `);
            console.log('Tabela "users" verificada/criada.');

        } catch (error) {
            console.error('Erro na migração migration_20250912.js:', error.message);
            throw error; // Rejeita a Promise para que run-migrations.js capture o erro
        }
    }
};
