const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./database.js');
<<<<<<< HEAD
const crypto = require('crypto');
const config = require('./config'); // Adicionar esta linha
=======
const config = require('./config');
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec

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

<<<<<<< HEAD
        // Se o usuário não existe, cria um novo
        const newUser = {
            username: displayName.replace(/\s+/g, '') + Math.floor(Math.random() * 1000), // Cria um username único
            email: email,
            // A senha pode ser nula ou um valor aleatório, pois o login será via Google
            password: crypto.randomBytes(20).toString('hex'),
            google_id: googleId,
            is_confirmed: 1, // E-mail do Google já é verificado
            subscription_type: 'none',
            last_login_date: Date.now(),
            subscription_end_date: null,
            free_plays_used: 0,
            show_welcome_modal: 1,
            role: 'user',
            created_at: Date.now()
        };

        const sql = 'INSERT INTO users (username, email, password, google_id, is_confirmed, subscription_type, subscription_end_date, last_login_date, free_plays_used, show_welcome_modal, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const params = [
            newUser.username,
            newUser.email,
            newUser.password,
            newUser.google_id,
            newUser.is_confirmed,
            newUser.subscription_type,
            newUser.subscription_end_date,
            newUser.last_login_date,
            newUser.free_plays_used,
            newUser.show_welcome_modal,
            newUser.role,
            newUser.created_at
=======
        // Abordagem ultra-simplificada: Inserir apenas o essencial.
        const newUsername = displayName.replace(/\s+/g, '') + Math.floor(Math.random() * 1000);

        const sql = `INSERT INTO users (email, google_id, username, is_confirmed, last_login_date)
                     VALUES ($1, $2, $3, $4, $5) RETURNING *`;
        
        const params = [
            email,
            googleId,
            newUsername,
            true,       // O e-mail do Google é considerado verificado
            new Date()  // Define a data de último login
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
        ];

        const newUserResult = await db.query(sql, params);
        return done(null, newUserResult.rows[0]);

    } catch (err) {
        console.error("Erro na estratégia Google (versão simplificada):", err);
        return done(err);
    }
}
));
