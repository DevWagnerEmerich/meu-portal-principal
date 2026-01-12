require('dotenv').config();

module.exports = {
<<<<<<< HEAD
  port: process.env.API_PORT || 3001,
=======
  port: process.env.PORT || 3000,
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
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
<<<<<<< HEAD
    path: process.env.DB_PATH || './portal_jogos.db',
=======
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/database',
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
  },
  adminEmail: process.env.EMAIL_USER
};
