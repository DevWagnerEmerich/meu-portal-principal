require('dotenv').config();
const db = require('./src/database.js');

async function fixLimits() {
    try {
        console.log("Updating free_plays_limit to 2...");
        const count = await db('system_settings')
            .where('key', 'free_plays_limit')
            .update({ value: '2' });

        console.log(`Updated ${count} row(s).`);

        const settings = await db('system_settings').where('key', 'free_plays_limit').first();
        console.log("New Limit in DB:", settings.value);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
fixLimits();
