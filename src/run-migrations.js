const db = require('./database');
const logger = require('./logger');

async function runMigrations() {
    try {
        logger.info('Iniciando migrações via Knex...');
        await db.migrate.latest();
        logger.info('Migrações concluídas com sucesso.');
    } catch (error) {
        logger.error('Erro ao executar migrações:', error);
        throw error;
    }
}

if (require.main === module) {
    runMigrations()
        .then(() => {
            logger.info('Processo de migração manual finalizado.');
            process.exit(0);
        })
        .catch(err => {
            logger.error('Falha na migração manual:', err);
            process.exit(1);
        });
}

module.exports = { runMigrations };
