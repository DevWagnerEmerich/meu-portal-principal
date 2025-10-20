const { getClient } = require('./database'); // Usamos getClient para ter controle sobre a conexão
const fs = require('fs').promises;
const path = require('path');

async function runMigrations() {
    let client; // O cliente da conexão
    try {
        client = await getClient();
        console.log('Conectado ao banco de dados PostgreSQL para migrations.');

        // 1. Criar a tabela de migrations se não existir
        await client.query(`CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE,
            run_at TIMESTAMPTZ DEFAULT NOW()
        )`);
        console.log('Tabela de migrations verificada/criada.');

        // 2. Obter migrations já executadas
        const executedResult = await client.query('SELECT name FROM migrations');
        const executedMigrations = new Set(executedResult.rows.map(row => row.name));

        // 3. Obter todos os arquivos de migration
        const migrationsDir = __dirname; // As migrations estão no mesmo diretório
        const migrationFiles = (await fs.readdir(migrationsDir))
            .filter(file => file.startsWith('migration_') && file.endsWith('.js'))
            .sort(); // Garante a ordem de execução

        console.log(`Encontradas ${migrationFiles.length} migrations.`);

        // 4. Executar migrations pendentes
        for (const file of migrationFiles) {
            if (!executedMigrations.has(file)) {
                console.log(`Executando migration: ${file}`);
                const migration = require(path.join(migrationsDir, file));
                
                // Passamos o cliente conectado para a migration
                if (migration.up && typeof migration.up === 'function') {
                    await client.query('BEGIN'); // Inicia a transação
                    try {
                        await migration.up(client); // Executa a lógica da migration
                        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
                        await client.query('COMMIT'); // Finaliza a transação
                        console.log(`Migration ${file} executada e registrada com sucesso.`);
                    } catch (migrationErr) {
                        await client.query('ROLLBACK'); // Desfaz em caso de erro
                        console.error(`Erro ao executar migration ${file}:`, migrationErr.message);
                        throw migrationErr;
                    }
                } else {
                    console.warn(`Migration ${file} não possui função 'up' exportada.`);
                }
            }
        }
        console.log('Todas as migrations foram executadas ou já estavam em dia.');

    } catch (error) {
        console.error('Erro geral no processo de migrations:', error.message);
        process.exit(1);
    } finally {
        if (client) {
            client.release(); // Libera o cliente de volta para o pool
            console.log('Conexão com o banco de dados liberada.');
        }
    }
}

// Chamar a função principal para iniciar o processo
runMigrations();
