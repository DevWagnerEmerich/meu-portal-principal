const bcrypt = require('bcrypt');
const db = require('./database.js');

const saltRounds = 10;
const adminUsername = 'admin';
const adminEmail = 'admin@educatech.com';
const adminPassword = 'adminpassword'; // Senha temporária

async function createAdmin() {
    try {
        // Verifica se o admin já existe
        db.get('SELECT * FROM users WHERE username = ? OR email = ?', [adminUsername, adminEmail], async (err, row) => {
            if (err) {
                console.error('Erro ao verificar usuário existente:', err.message);
                db.close();
                return;
            }
            if (row) {
                console.log('Usuário administrador já existe.');
                db.close();
                return;
            }

            const hash = await bcrypt.hash(adminPassword, saltRounds);
            const sql = `
                INSERT INTO users (username, email, password, role, is_confirmed, subscription_type, daily_time_left, last_login_date)
                VALUES (?, ?, ?, 'admin', 1, 'premium', 999999, ?)
            `;
            const now = Date.now();

            db.run(sql, [adminUsername, adminEmail, hash, now], function(err) {
                if (err) {
                    console.error('Erro ao criar usuário administrador:', err.message);
                } else {
                    console.log(`Usuário administrador 'admin' criado com sucesso!`);
                    console.log(`Use a senha: ${adminPassword}`);
                    console.log('Por favor, altere a senha após o primeiro login.');
                }
                db.close((err) => {
                    if (err) {
                        console.error(err.message);
                    }
                    console.log('Conexão com o banco de dados fechada.');
                });
            });
        });
    } catch (error) {
        console.error('Erro ao processar a criação do administrador:', error);
        db.close();
    }
}

createAdmin();
