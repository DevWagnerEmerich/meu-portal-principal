require('dotenv').config();

module.exports = {
  // Porta do servidor (API)
  port: process.env.PORT || 3001,

  sessionSecret: process.env.SESSION_SECRET || 'uma-chave-secreta-muito-forte',
  isProduction: process.env.NODE_ENV === 'production',
  domain: process.env.DOMAIN || 'http://localhost:3000',

  email: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publicKey: process.env.STRIPE_PUBLIC_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  google: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.DOMAIN || 'http://localhost:3000'}/api/auth/google/callback`,
  },

  // Configurações herdadas/extras (o Knex usa knexfile.js)
  database: {
    url: process.env.DATABASE_URL,
    path: process.env.DB_PATH || './portal_jogos_v2.db',
  },

  adminEmail: process.env.EMAIL_USER
};
