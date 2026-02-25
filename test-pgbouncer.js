require('dotenv').config();
const { Client } = require('pg');

async function testConnection() {
    let connString = process.env.DATABASE_URL;
    console.log("Original URL:", connString);

    if (connString.includes(':5432')) {
        connString = connString.replace(':5432', ':6543');
        if (!connString.includes('pgbouncer=true')) {
            connString += (connString.includes('?') ? '&' : '?') + 'pgbouncer=true';
        }
    }

    console.log("Modified URL for Serverless PgBouncer:", connString);

    const client = new Client({
        connectionString: connString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query('SELECT 1 as result');
        console.log("Connection successful! Result:", res.rows[0]);
    } catch (e) {
        console.error("Connection failed:", e);
    } finally {
        await client.end();
        process.exit(0);
    }
}

testConnection();
