const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log('Ambiente:', process.env.NODE_ENV);
console.log('DATABASE_URL presente?', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) console.log('DB Host:', new URL(process.env.DATABASE_URL).host);

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
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        },
        migrations: {
            directory: path.join(__dirname, '..', 'migrations')
        },
        seeds: {
            directory: path.join(__dirname, '..', 'seeds')
        },
        pool: {
            min: 0,
            max: 1 // Testando conexão única para evitar problemas de pooler
        }
    }
};
