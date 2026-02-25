require('dotenv').config();
const db = require('./src/database.js');

async function debug() {
    try {
        const settings = await db('system_settings').where('key', 'free_plays_limit').first();
        console.log("FREE PLAYS IN DB:", settings);

        const BusinessRules = require('./src/business-rules');
        console.log("BusinessRules.FREE_PLAYS.LIMIT:", BusinessRules.FREE_PLAYS.LIMIT);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
debug();
