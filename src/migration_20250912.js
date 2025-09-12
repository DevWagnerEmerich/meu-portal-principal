
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./portal_jogos.db');

console.log('Iniciando migração do banco de dados...');

db.serialize(() => {
    // 1. Criar a nova tabela para controlar jogadas gratuitas
    db.run(`
        CREATE TABLE IF NOT EXISTS user_free_plays (
            user_id INTEGER NOT NULL,
            game_id TEXT NOT NULL,
            plays_used INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (user_id, game_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `, (err) => {
        if (err) {
            console.error('Erro ao criar a tabela user_free_plays:', err.message);
            return;
        }
        console.log('Tabela "user_free_plays" criada ou já existente.');
    });

    // 2. Remover a coluna 'daily_time_left' da tabela 'users'
    // O SQLite não suporta 'DROP COLUMN' diretamente de forma simples.
    // A abordagem segura é criar uma nova tabela sem a coluna e copiar os dados.
    console.log('Iniciando a remoção da coluna "daily_time_left" da tabela "users"...');

    db.run('PRAGMA foreign_keys=off;', (err) => {
        if (err) return console.error('Erro ao desativar foreign_keys:', err.message);

        db.run('BEGIN TRANSACTION;', (err) => {
            if (err) return console.error('Erro ao iniciar transação:', err.message);

            // Renomear a tabela antiga
            db.run('ALTER TABLE users RENAME TO users_old;', (err) => {
                if (err) {
                    // Se a tabela 'users_old' já existe, pode ser de uma migração anterior que falhou.
                    if (err.message.includes('already exists')) {
                        console.log('Tabela "users_old" já existe. Pulando a renomeação.');
                    } else {
                        console.error('Erro ao renomear tabela users:', err.message);
                        db.run('ROLLBACK;');
                        return;
                    }
                }
                console.log('Tabela "users" renomeada para "users_old".');

                // Criar a nova tabela 'users' com a estrutura correta (sem daily_time_left)
                db.run(`
                    CREATE TABLE users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT UNIQUE,
                        email TEXT UNIQUE,
                        password TEXT,
                        is_confirmed INTEGER DEFAULT 0,
                        subscription_type TEXT DEFAULT 'none',
                        subscription_end_date INTEGER,
                        last_login_date INTEGER,
                        role TEXT DEFAULT 'user',
                        created_at INTEGER
                    );
                `, (err) => {
                    if (err) {
                        console.error('Erro ao criar a nova tabela users:', err.message);
                        db.run('ROLLBACK;');
                        return;
                    }
                    console.log('Nova tabela "users" criada com a estrutura atualizada.');

                    // Copiar os dados da tabela antiga para a nova
                    const columns = 'id, username, email, password, is_confirmed, subscription_type, subscription_end_date, last_login_date, role, created_at';
                    db.run(`INSERT INTO users (${columns}) SELECT ${columns} FROM users_old;`, (err) => {
                        if (err) {
                            console.error('Erro ao copiar dados para a nova tabela users:', err.message);
                            db.run('ROLLBACK;');
                            return;
                        }
                        console.log('Dados copiados para a nova tabela "users".');

                        // Remover a tabela antiga
                        db.run('DROP TABLE users_old;', (err) => {
                            if (err) {
                                console.error('Erro ao remover a tabela users_old:', err.message);
                                db.run('ROLLBACK;');
                                return;
                            }
                            console.log('Tabela "users_old" removida.');

                            db.run('COMMIT;', (err) => {
                                if (err) {
                                    console.error('Erro ao commitar a transação:', err.message);
                                } else {
                                    console.log('Coluna "daily_time_left" removida com sucesso.');
                                    db.run('PRAGMA foreign_keys=on;', (err) => {
                                        if (err) console.error('Erro ao reativar foreign_keys:', err.message);
                                        console.log('Migração do banco de dados concluída.');
                                        db.close();
                                    });
                                }
                            });
                        });
                    });
                });
            });
        });
    });
});
