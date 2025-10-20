module.exports = {
    up: async (client) => {
        console.log('Iniciando migração: migration_20250912.js (ordem corrigida)');

        try {
            // 1. CRIAR A TABELA USERS PRIMEIRO. É a dependência principal.
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

            // 2. Agora que a tabela users existe, podemos modificá-la.
            await client.query(`ALTER TABLE users DROP COLUMN IF EXISTS daily_time_left;`);
            console.log('Coluna "daily_time_left" removida da tabela "users" (se existia).');

            // 3. E agora podemos criar tabelas que têm referência para a tabela users.
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

            await client.query(`
                CREATE TABLE IF NOT EXISTS email_confirmations (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER,
                    token TEXT UNIQUE,
                    expires_at BIGINT,
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

        } catch (error) {
            console.error('Erro na migração migration_20250912.js:', error);
            throw error;
        }
    }
};