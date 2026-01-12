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
        for (const file of migrationFiles) {
            if (!executedMigrations.has(file)) {
                console.log(`Executando migration: ${file}`);
                const migration = require(path.join(migrationsDir, file));
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
        if (db) {
            db.close((closeErr) => {
                if (closeErr) {
                    console.error('Erro ao fechar a conexão com o banco de dados:', closeErr.message);
                }
                console.log('Conexão com o banco de dados fechada.');
            });
        }
    }
}

// Chamar a função principal para iniciar o processo
runMigrations();