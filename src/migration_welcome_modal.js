module.exports = {
<<<<<<< HEAD
    up: async (db) => {
        const dbRun = (sql, params = []) => {
            return new Promise((resolve, reject) => {
                db.run(sql, params, function(err) {
                    if (err) reject(err);
                    resolve(this);
                });
            });
        };

        console.log('Iniciando migração: migration_welcome_modal.js');

        try {
            await dbRun("ALTER TABLE users ADD COLUMN show_welcome_modal INTEGER DEFAULT 1").catch(err => {
                if (err.message.includes('duplicate column name')) {
                    console.log('Coluna "show_welcome_modal" já existe.');
                } else {
                    throw err; // Re-lança outros erros
                }
            });
            console.log('Coluna "show_welcome_modal" verificada/adicionada à tabela "users".');

        } catch (error) {
            console.error('Erro na migração migration_welcome_modal.js:', error.message);
            throw error; // Rejeita a Promise para que run-migrations.js capture o erro
        }
    }
};
=======
    up: async (client) => {
        console.log('Iniciando migração: migration_welcome_modal.js');
        try {
            // Usamos a mesma lógica de capturar o erro de coluna duplicada do PostgreSQL
            await client.query("ALTER TABLE users ADD COLUMN show_welcome_modal BOOLEAN DEFAULT true").catch(err => {
                if (err.code === '42701') { // 42701 = duplicate column
                    console.log('Coluna "show_welcome_modal" já existe.');
                } else {
                    throw err; // Re-lança outros erros
                }
            });
            console.log('Coluna "show_welcome_modal" verificada/adicionada à tabela "users".');

        } catch (error) {
            console.error('Erro na migração migration_welcome_modal.js:', error.message);
            throw error;
        }
    }
};
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
