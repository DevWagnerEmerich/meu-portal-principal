require('dotenv').config();
const db = require('./src/database.js');

async function checkGames() {
    try {
        const games = await db('games').select('id', 'title', 'printable_url').where('title', 'like', '%Bingo%').orWhere('title', 'like', '%Tabela%');
        console.log("Found Bingo Games in DB:", JSON.stringify(games, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
checkGames();
