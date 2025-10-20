const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./database.js');
const crypto = require('crypto');
const config = require('./config');

require('dotenv').config();

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, rows[0]);
    } catch (err) {
        done(err, null);
    }
});

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
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        let user = userResult.rows[0];

        if (user) {
            if (!user.google_id) {
                await db.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, user.id]);
            }
            return done(null, user);
        }

        // Se o usuário não existe, cria um novo com os tipos corretos
        const newUsername = displayName.replace(/\s+/g, '') + Math.floor(Math.random() * 1000);
        const randomPassword = crypto.randomBytes(20).toString('hex');

        // SQL simplificado, deixando o DB cuidar dos defaults (role, created_at, etc)
        const sql = `INSERT INTO users (username, email, password, google_id, is_confirmed, last_login_date)
                     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
        
        const params = [
            newUsername,
            email,
            randomPassword,
            googleId,
            true, // Usando booleano 'true' em vez de 1
            new Date() // Usando um objeto Date
        ];

        const newUserResult = await db.query(sql, params);
        return done(null, newUserResult.rows[0]);

    } catch (err) {
        console.error("Erro na estratégia Google:", err);
        return done(err);
    }
}
));