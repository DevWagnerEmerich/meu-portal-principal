const fs = require('fs');
const path = require('path');
const db = require('./database');

async function importGames() {
    try {
        const jsonPath = path.join(__dirname, '..', 'public', 'games.json');
        const rawData = fs.readFileSync(jsonPath, 'utf-8');
        const games = JSON.parse(rawData);

        console.log(`Lendo ${games.length} jogos de games.json...`);

        for (const game of games) {
            // Verifica se já existe
            const existing = await db('games').where({ id: game.id }).first();

            const gameData = {
                id: game.id,
                title: game.title,
                description: game.description,
                thumbnail: game.thumbnail,
                game_url: game.game_url,
                printable_url: game.printable_url || null,
                is_premium: game.is_premium || false,
                is_featured: game.is_featured || false,
                category: game.category || 'Geral',
                updated_at: new Date() // Force update timestamp
            };

            if (existing) {
                console.log(`Atualizando jogo: ${game.title}`);
                await db('games').where({ id: game.id }).update(gameData);
            } else {
                console.log(`Inserindo novo jogo: ${game.title}`);
                await db('games').insert(gameData);
            }
        }

        console.log('Migração de jogos concluída com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('Erro ao importar jogos:', error);
        process.exit(1);
    }
}

importGames();
