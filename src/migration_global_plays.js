
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./portal_jogos.db');

console.log('Iniciando migração para controle de jogadas globais...');

db.serialize(() => {
    // 1. Adicionar a coluna 'free_plays_used' à tabela 'users' se ela não existir
    db.run("ALTER TABLE users ADD COLUMN free_plays_used INTEGER DEFAULT 0", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('Coluna "free_plays_used" já existe na tabela "users".');
            } else {
                console.error('Erro ao adicionar a coluna free_plays_used:', err.message);
                return;
            }
        } else {
            console.log('Coluna "free_plays_used" adicionada à tabela "users".');
        }
    });

    // 2. Remover a tabela 'user_free_plays' se ela existir
    db.run("DROP TABLE IF EXISTS user_free_plays", (err) => {
        if (err) {
            console.error('Erro ao remover a tabela user_free_plays:', err.message);
            return;
        }
        console.log('Tabela "user_free_plays" removida com sucesso.');
    });

    // Fecha a conexão com o banco de dados
    db.close((err) => {
        if (err) {
            console.error('Erro ao fechar o banco de dados', err.message);
        }
        console.log('Migração concluída.');
    });
});
