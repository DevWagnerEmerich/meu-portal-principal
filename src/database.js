const sqlite3 = require('sqlite3').verbose();

// Conecta ao banco de dados (cria o arquivo se não existir)
const db = new sqlite3.Database('./portal_jogos.db', (err) => {
    if (err) {
        console.error('Erro ao abrir o banco de dados', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        // Cria a tabela de usuários se ela não existir
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            password TEXT,
            is_confirmed INTEGER DEFAULT 0,
            subscription_type TEXT DEFAULT 'none',
            subscription_end_date INTEGER,
            last_login_date INTEGER,
            free_plays_used INTEGER DEFAULT 0,
            show_welcome_modal INTEGER DEFAULT 1,
            role TEXT DEFAULT 'user', -- New column
            created_at INTEGER
        )`, (err) => {
            if (err) {
                console.error('Erro ao criar a tabela users', err.message);
            } else {
                // Adiciona a coluna 'role' se ela não existir
                db.all(`PRAGMA table_info(users)`, [], (err, columns) => {
                    if (err) {
                        console.error('Erro ao verificar colunas da tabela users:', err.message);
                        return;
                    }
                    const hasRoleColumn = columns.some(column => column.name === 'role');
                    if (!hasRoleColumn) {
                        db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, (alterErr) => {
                            if (alterErr) {
                                console.error('Erro ao adicionar coluna role à tabela users:', alterErr.message);
                            } else {
                                console.log('Coluna role adicionada à tabela users.');
                            }
                        });
                    }

                    const hasCreatedAtColumn = columns.some(column => column.name === 'created_at');
                    if (!hasCreatedAtColumn) {
                        db.run(`ALTER TABLE users ADD COLUMN created_at INTEGER DEFAULT 0`, (alterErr) => {
                            if (alterErr) {
                                console.error('Erro ao adicionar coluna created_at à tabela users:', alterErr.message);
                            } else {
                                console.log('Coluna created_at adicionada à tabela users.');
                            }
                        });
                    }
                });
            }
        });

        // Cria a tabela para tokens de confirmação de e-mail
        db.run(`CREATE TABLE IF NOT EXISTS email_confirmations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            token TEXT UNIQUE,
            expires_at INTEGER,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`, (err) => {
            if (err) {
                console.error('Erro ao criar a tabela email_confirmations', err.message);
            }
        });

        // Cria a tabela para tokens de recuperação de senha
        db.run(`CREATE TABLE IF NOT EXISTS password_resets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            token TEXT UNIQUE,
            expires_at INTEGER,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`, (err) => {
            if (err) {
                console.error('Erro ao criar a tabela password_resets', err.message);
            }
        });

        // Cria a tabela para registros de jogadas
        db.run(`CREATE TABLE IF NOT EXISTS game_plays (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            game_id TEXT,
            start_time INTEGER,
            end_time INTEGER,
            duration_seconds INTEGER,
            is_free_trial INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`, (err) => {
            if (err) {
                console.error('Erro ao criar a tabela game_plays', err.message);
            }
        });
    }
});

module.exports = db;