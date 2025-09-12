
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./portal_jogos.db');

console.log('Iniciando migração para adicionar a flag do modal de boas-vindas...');

db.serialize(() => {
    db.run("ALTER TABLE users ADD COLUMN show_welcome_modal INTEGER DEFAULT 1", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('Coluna "show_welcome_modal" já existe.');
            } else {
                console.error('Erro ao adicionar a coluna show_welcome_modal:', err.message);
                return;
            }
        } else {
            console.log('Coluna "show_welcome_modal" adicionada com sucesso.');
        }
    });

    db.close((err) => {
        if (err) {
            console.error('Erro ao fechar o banco de dados', err.message);
        }
        console.log('Migração do modal de boas-vindas concluída.');
    });
});
