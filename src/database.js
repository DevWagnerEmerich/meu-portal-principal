const { Pool } = require('pg');
const config = require('./config');

// O Pool gerencia múltiplas conexões para nós. É a forma recomendada de usar o pg.
const pool = new Pool({
  // A connectionString é a forma mais fácil de configurar. 
  // O Render fornecerá essa string completa nas variáveis de ambiente.
  connectionString: config.database.url, 
  // Em produção no Render, é necessário usar SSL, mas sem rejeitar certificados autoassinados.
  ssl: config.isProduction ? { rejectUnauthorized: false } : false,
});

// Exportamos um objeto com um método 'query'.
// Isso desacopla o resto da nossa aplicação de saber qual banco de dados estamos usando.
// Qualquer parte da aplicação pode agora chamar db.query(sql, params) e funcionará.
module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool: pool, // Exporta o pool diretamente
};
