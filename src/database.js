const knex = require('knex');
const config = require('./knexfile');
const logger = require('./logger');

const environment = process.env.DATABASE_URL ? 'production' : (process.env.NODE_ENV || 'development');
const dbConfig = config[environment];

const db = knex(dbConfig);

// Helper para verificar conexão
db.raw('SELECT 1')
  .then(() => {
    logger.info(`Conectado ao banco de dados (${environment}).`);
  })
  .catch((e) => {
    logger.error('Falha ao conectar ao banco de dados:', e);
  });

module.exports = db;
