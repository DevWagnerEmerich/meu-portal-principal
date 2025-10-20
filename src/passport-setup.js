const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./database.js');
const crypto = require('crypto');
const config = require('./config');

require('dotenv').config();

// Serializa o usuário para armazenar na sessão
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Desserializa o usuário a partir do ID na sessão (corrigido para async/await e pg)
passport.deserializeUser(async (id, done) => {
    try {
        const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, rows[0]); // Passa o objeto do usuário para o done
    } catch (err) {
        done(err, null);
    }
});

// Configuração da Estratégia do Google (corrigido para async/await e pg)
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: config.google.callbackURL,
    scope: ['profile', 'email']
},
async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;
    const googleId = profile.id;
    const displayName = profile.displayName;

    try {
        // Procura se o usuário já existe
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        let user = userResult.rows[0];

        if (user) {
            // Se o usuário já existe, atualiza o google_id se estiver faltando
            if (!user.google_id) {
                await db.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, user.id]);
            }
            return done(null, user);
        }

        // Se o usuário não existe, cria um novo
        const newUsername = displayName.replace(/\s+/g, '') + Math.floor(Math.random() * 1000);
        const randomPassword = crypto.randomBytes(20).toString('hex'); // Senha aleatória, já que o login é via Google
        const now = Date.now();

        const sql = `INSERT INTO users (username, email, password, google_id, is_confirmed, subscription_type, subscription_end_date, last_login_date, free_plays_used, show_welcome_modal, role, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`;
        
        const params = [
            newUsername, email, randomPassword, googleId, 1, 'none', null, now, 0, 1, 'user', now
        ];

        const newUserResult = await db.query(sql, params);
        return done(null, newUserResult.rows[0]);

    } catch (err) {
        return done(err);
    }
}
));
