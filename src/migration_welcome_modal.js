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