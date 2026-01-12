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

        const dbGet = (sql, params = []) => {
            return new Promise((resolve, reject) => {
                db.get(sql, params, (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });
        };

        console.log('Iniciando migração: migration_20250912.js');

        try {
            // 1. Criar a nova tabela para controlar jogadas gratuitas
            await dbRun(`
                CREATE TABLE IF NOT EXISTS user_free_plays (
                    user_id INTEGER NOT NULL,
                    game_id TEXT NOT NULL,
                    plays_used INTEGER NOT NULL DEFAULT 0,
                    PRIMARY KEY (user_id, game_id),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
            `);
            console.log('Tabela "user_free_plays" criada ou já existente.');

            // 2. Remover a coluna 'daily_time_left' da tabela 'users'
            // O SQLite não suporta 'DROP COLUMN' diretamente de forma simples.
            // A abordagem segura é criar uma nova tabela sem a coluna e copiar os dados.
            console.log('Iniciando a remoção da coluna "daily_time_left" da tabela "users"...');

            await dbRun('PRAGMA foreign_keys=off;');

            // Verificar se users_old já existe (caso uma migração anterior tenha falhado)
            const usersOldExists = await dbGet("SELECT name FROM sqlite_master WHERE type='table' AND name='users_old'");
            if (usersOldExists) {
                console.log('Tabela "users_old" já existe. Pulando a renomeação e assumindo que a nova tabela users já foi criada.');
                // Se users_old existe, assumimos que a nova users também existe e os dados foram copiados.
                // Apenas garantimos que foreign_keys está on e commitamos.
                await dbRun('PRAGMA foreign_keys=on;');
                console.log('Migração de remoção de daily_time_left já processada ou recuperada.');
                return; // Sai da migration
            }

            // Renomear a tabela antiga
            await dbRun('ALTER TABLE users RENAME TO users_old;');
            console.log('Tabela "users" renomeada para "users_old".');

            // Criar a nova tabela 'users' com a estrutura correta (sem daily_time_left)
            await dbRun(`
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE,
                    email TEXT UNIQUE,
                    password TEXT,
                    google_id TEXT UNIQUE, -- Adicionar esta linha
                    is_confirmed INTEGER DEFAULT 0,
                    subscription_type TEXT DEFAULT 'none',
                    subscription_end_date INTEGER,
                    last_login_date INTEGER,
                    role TEXT DEFAULT 'user',
                    created_at INTEGER
                );
            `);
            console.log('Nova tabela "users" criada com a estrutura atualizada.');

            // Copiar os dados da tabela antiga para a nova
            const columns = 'id, username, email, password, google_id, is_confirmed, subscription_type, subscription_end_date, last_login_date, role, created_at';
            await dbRun(`INSERT INTO users (${columns}) SELECT ${columns} FROM users_old;`);
            console.log('Dados copiados para a nova tabela "users".');

            // Remover a tabela antiga
            await dbRun('DROP TABLE users_old;');
            console.log('Tabela "users_old" removida.');

            await dbRun('PRAGMA foreign_keys=on;');
            console.log('Coluna "daily_time_left" removida com sucesso.');

        } catch (error) {
            console.error('Erro na migração migration_20250912.js:', error.message);
            await dbRun('ROLLBACK;');
            throw error; // Rejeita a Promise para que run-migrations.js capture o erro
        }
    }
};