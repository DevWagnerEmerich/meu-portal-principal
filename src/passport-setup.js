const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./database.js');
const crypto = require('crypto');

// Garante que as variáveis de ambiente sejam carregadas
require('dotenv').config();

// Serializa o usuário para armazenar na sessão
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Desserializa o usuário a partir do ID na sessão
passport.deserializeUser((id, done) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
        done(err, user);
    });
});

// Configuração da Estratégia do Google
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
    scope: ['profile', 'email']
},
async (accessToken, refreshToken, profile, done) => {
    // Esta função é chamada após o usuário fazer login no Google
    const email = profile.emails[0].value;
    const googleId = profile.id;
    const displayName = profile.displayName;

    // Procura se o usuário já existe no banco de dados
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) { return done(err); }

        // Se o usuário já existe, retorna o usuário
        if (user) {
            // Opcional: atualizar o googleId se estiver faltando
            if (!user.google_id) {
                db.run('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id]);
            }
            return done(null, user);
        }

        // Se o usuário não existe, cria um novo
        const newUser = {
            username: displayName.replace(/\s+/g, '') + Math.floor(Math.random() * 1000), // Cria um username único
            email: email,
            // A senha pode ser nula ou um valor aleatório, pois o login será via Google
            password: crypto.randomBytes(20).toString('hex'),
            google_id: googleId,
            is_confirmed: 1, // E-mail do Google já é verificado
            subscription_type: 'none',
            daily_time_left: 900, // 15 minutos
            last_login_date: Date.now()
        };

        const sql = 'INSERT INTO users (username, email, password, google_id, is_confirmed, subscription_type, daily_time_left, last_login_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const params = [newUser.username, newUser.email, newUser.password, newUser.google_id, newUser.is_confirmed, newUser.subscription_type, newUser.daily_time_left, newUser.last_login_date];

        db.run(sql, params, function(err) {
            if (err) { return done(err); }
            newUser.id = this.lastID;
            return done(null, newUser);
        });
    });
}
));