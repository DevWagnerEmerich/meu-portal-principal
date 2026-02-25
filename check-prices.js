require('dotenv').config();
const db = require('./src/database.js');

async function checkPrices() {
    try {
        const settings = await db('system_settings').whereIn('key', [
            'monthly_plan_price', 'semiannual_plan_price', 'annual_plan_price'
        ]);
        console.log("Prices in DB:", settings);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
checkPrices();
