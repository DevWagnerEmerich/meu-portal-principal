module.exports = {
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
