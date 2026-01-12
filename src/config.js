require('dotenv').config();

module.exports = {
  port: process.env.API_PORT || 3001,
  sessionSecret: process.env.SESSION_SECRET || 'uma-chave-secreta-muito-forte',
  isProduction: process.env.NODE_ENV === 'production',
  domain: process.env.DOMAIN || 'http://localhost:3000',
  email: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  mercadoPago: {
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY,
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
  },
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.DOMAIN || 'http://localhost:3000'}/api/auth/google/callback`,
  },
  database: {
    path: process.env.DB_PATH || './portal_jogos.db',
  },
  adminEmail: process.env.EMAIL_USER
};
