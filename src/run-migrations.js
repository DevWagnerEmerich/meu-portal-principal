<<<<<<< HEAD
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs').promises;
const path = require('path');
const config = require('./config');

let db; // Declarar db no escopo global do módulo

const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            resolve(this);
        });
    });
};

const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            resolve(rows);
        });
    });
};

async function runMigrations() {
    try {
        // Abrir a conexão com o banco de dados
        db = new sqlite3.Database(config.database.path, (err) => {
            if (err) {
                console.error('Erro ao abrir o banco de dados:', err.message);
                process.exit(1);
            }
            console.log('Conectado ao banco de dados SQLite para migrations.');
        });

        // 1. Criar a tabela de migrations se não existir
        await dbRun(`CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            run_at INTEGER
        )`);
        console.log('Tabela de migrations verificada/criada.');

        // 2. Obter migrations já executadas
        const executedMigrations = new Set((await dbAll('SELECT name FROM migrations')).map(row => row.name));

        // 3. Obter todos os arquivos de migration
        const migrationsDir = path.join(__dirname);
        const migrationFiles = (await fs.readdir(migrationsDir))
            .filter(file => file.startsWith('migration_') && file.endsWith('.js'))
            .sort(); // Garante a ordem de execução

        console.log(`Encontradas ${migrationFiles.length} migrations.`);

        // 4. Executar migrations pendentes
=======
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

>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
        for (const file of migrationFiles) {
            if (!executedMigrations.has(file)) {
                console.log(`Executando migration: ${file}`);
                const migration = require(path.join(migrationsDir, file));
<<<<<<< HEAD
                if (migration.up && typeof migration.up === 'function') {
                    await dbRun('BEGIN TRANSACTION');
                    try {
                        await migration.up(db); // Executa a lógica da migration
                        await dbRun('INSERT INTO migrations (name, run_at) VALUES (?, ?)', [file, Date.now()]);
                        await dbRun('COMMIT');
                        console.log(`Migration ${file} executada e registrada com sucesso.`);
                    } catch (migrationErr) {
                        await dbRun('ROLLBACK');
                        console.error(`Erro ao executar migration ${file}:`, migrationErr.message);
=======
                
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
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
                        throw migrationErr;
                    }
                } else {
                    console.warn(`Migration ${file} não possui função 'up' exportada.`);
                }
            }
        }
<<<<<<< HEAD
        console.log('Todas as migrations foram executadas ou já estavam em dia.');

    } catch (error) {
        console.error('Erro geral no processo de migrations:', error.message);
        process.exit(1);
    } finally {
        if (db) {
            db.close((closeErr) => {
                if (closeErr) {
                    console.error('Erro ao fechar a conexão com o banco de dados:', closeErr.message);
                }
                console.log('Conexão com o banco de dados fechada.');
            });
=======
        console.log('Processo de migração concluído com sucesso.');

    } catch (error) {
        console.error('Erro geral no processo de migrations. Erro completo:', error);
        throw error; // Lança o erro para que o server.js possa capturá-lo
    } finally {
        if (client) {
            client.release();
            console.log('Conexão de migração com o banco de dados liberada.');
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
        }
    }
}

<<<<<<< HEAD
// Chamar a função principal para iniciar o processo
runMigrations();
=======
// Se o arquivo for executado diretamente, rode as migrações.
// Isso mantém a possibilidade de rodá-lo manualmente se necessário.
if (require.main === module) {
    runMigrations().catch(err => process.exit(1));
}

// Exporta a função para que possa ser usada em outro lugar
module.exports = { runMigrations };
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
