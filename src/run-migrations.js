const { getClient } = require('./database');
const fs = require('fs').promises;
const path = require('path');

// A função agora é exportada para poder ser chamada pelo server.js
async function runMigrations() {
    let client;
    try {
        client = await getClient();
        console.log('Conectado ao banco de dados PostgreSQL para migrations.');

        await client.query(`CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE,
            run_at TIMESTAMPTZ DEFAULT NOW()
        )`);
        console.log('Tabela de migrations verificada/criada.');

        const executedResult = await client.query('SELECT name FROM migrations');
        const executedMigrations = new Set(executedResult.rows.map(row => row.name));

        const migrationsDir = __dirname;
        const migrationFiles = (await fs.readdir(migrationsDir))
            .filter(file => file.startsWith('migration_') && file.endsWith('.js'))
            .sort();

        console.log(`Encontradas ${migrationFiles.length} migrations.`);

        for (const file of migrationFiles) {
            if (!executedMigrations.has(file)) {
                console.log(`Executando migration: ${file}`);
                const migration = require(path.join(migrationsDir, file));
                
                if (migration.up && typeof migration.up === 'function') {
                    await client.query('BEGIN');
                    try {
                        await migration.up(client);
                        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
                        await client.query('COMMIT');
                        console.log(`Migration ${file} executada e registrada com sucesso.`);
                    } catch (migrationErr) {
                        await client.query('ROLLBACK');
                        console.error(`Erro ao executar migration ${file}:`, migrationErr);
                        throw migrationErr;
                    }
                } else {
                    console.warn(`Migration ${file} não possui função 'up' exportada.`);
                }
            }
        }
        console.log('Processo de migração concluído com sucesso.');

    } catch (error) {
        console.error('Erro geral no processo de migrations. Erro completo:', error);
        throw error; // Lança o erro para que o server.js possa capturá-lo
    } finally {
        if (client) {
            client.release();
            console.log('Conexão de migração com o banco de dados liberada.');
        }
    }
}

// Se o arquivo for executado diretamente, rode as migrações.
// Isso mantém a possibilidade de rodá-lo manualmente se necessário.
if (require.main === module) {
    runMigrations().catch(err => process.exit(1));
}

// Exporta a função para que possa ser usada em outro lugar
module.exports = { runMigrations };