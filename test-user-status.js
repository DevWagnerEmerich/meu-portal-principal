const db = require('./src/database.js');
const BusinessRules = require('./src/business-rules');

async function test() {
    try {
        const userId = 1; // Testing with first user
        const user = await db('users')
            .where('id', userId)
            .select('username', 'subscription_type', 'created_at', 'role')
            .first();

        console.log("User:", user);

        if (user) {
            const LIMIT = BusinessRules.FREE_PLAYS.LIMIT;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startOfDayTimestamp = today.getTime();

            const playsResult = await db('game_plays')
                .where('user_id', userId)
                .andWhere('is_free_trial', 1)
                .andWhere('start_time', '>=', startOfDayTimestamp)
                .count('id as count')
                .first();

            console.log("Plays Result:", playsResult);
        }
    } catch (err) {
        console.error("Crash:", err);
    } finally {
        process.exit(0);
    }
}

test();
