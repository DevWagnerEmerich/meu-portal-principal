const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log('Ambiente:', process.env.NODE_ENV);
console.log('DATABASE_URL presente?', !!process.env.DATABASE_URL);

let ServerlessURL = process.env.DATABASE_URL;
if (ServerlessURL && ServerlessURL.includes('pooler.supabase.com') && ServerlessURL.includes(':5432')) {
    ServerlessURL = ServerlessURL.replace(':5432', ':6543');
    if (!ServerlessURL.includes('pgbouncer=true')) {
        ServerlessURL += (ServerlessURL.includes('?') ? '&' : '?') + 'pgbouncer=true';
    }
}

if (ServerlessURL) console.log('DB Host:', new URL(ServerlessURL).host);

module.exports = {
    development: {
        client: 'sqlite3',
        connection: {
            filename: path.join(__dirname, '..', 'portal_jogos_v2.db')
        },
        useNullAsDefault: true,
        migrations: {
            directory: path.join(__dirname, '..', 'migrations')
        },
        seeds: {
            directory: path.join(__dirname, '..', 'seeds')
        }
    },

    production: {
        client: 'pg',
        connection: {
            connectionString: ServerlessURL,
            ssl: { rejectUnauthorized: false }
        },
        migrations: {
            directory: path.join(__dirname, '..', 'migrations')
        },
        seeds: {
            directory: path.join(__dirname, '..', 'seeds')
        },
        pool: {
            min: 1,
            max: 4
        }
    }
};
