const knex = require('knex');
const config = require('./knexfile');
const logger = require('./logger');

const environment = process.env.DATABASE_URL ? 'production' : (process.env.NODE_ENV || 'development');
const dbConfig = config[environment];

// Prevents exhausting DB connections on Vercel Serverless deployments
// by caching the knex instance in the global Node object during hot-reloads
let db;

if (!global.__db__) {
  db = knex(dbConfig);
  global.__db__ = db;

  // Helper para verificar conexão (roda apenas na primeira inicialização)
  db.raw('SELECT 1')
    .then(() => {
      logger.info(`Conectado ao banco de dados (${environment}). Pool configurado.`);
    })
    .catch((e) => {
      logger.error('Falha ao conectar ao banco de dados:', e);
    });
} else {
  db = global.__db__;
}

module.exports = db;
