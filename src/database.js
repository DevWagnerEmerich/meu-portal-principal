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
            daily_time_left INTEGER DEFAULT 900, -- 15 minutes in seconds
            last_login_date INTEGER
        )`, (err) => {
            if (err) {
                console.error('Erro ao criar a tabela users', err.message);
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
    }
});

module.exports = db;