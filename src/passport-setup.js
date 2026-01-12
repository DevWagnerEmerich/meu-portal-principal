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
        const user = await db('users').where('id', id).first();
        done(null, user);
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
            const user = await db('users').where('email', email).first();

            if (user) {
                if (!user.google_id) {
                    await db('users').where('id', user.id).update({ google_id: googleId });
                }
                return done(null, user);
            }

            // Se o usuário não existe, cria um novo
            const now = Date.now();
            const username = displayName.replace(/\s+/g, '') + Math.floor(Math.random() * 1000); // Cria um username único

            const [result] = await db('users').insert({
                username: username,
                email: email,
                password: crypto.randomBytes(20).toString('hex'), // Senha aleatória
                google_id: googleId,
                is_confirmed: 1, // E-mail do Google já é verificado (using 1 for boolean compatibility with sqlite/pg in Knex)
                subscription_type: 'none',
                last_login_date: now,

                free_plays_used: 0,
                show_welcome_modal: 1,
                role: 'user',
                created_at: now
            }).returning('*'); // Returning * works in PG. For sqlite it might not return row, so we might need to fetch.

            // Fallback or consistent way to get the inserted user
            let newUser = result;
            if (!newUser || typeof newUser !== 'object') {
                // If result is just ID or array of IDs (sqlite sometimes), fetch the user
                // But actually, for consistent behavior across DBs, let's fetch by email again or use the returned object if PG.
                // Simplest safe approach:
                newUser = await db('users').where('email', email).first();
            }

            return done(null, newUser);

        } catch (err) {
            console.error("Erro na estratégia Google:", err);
            return done(err);
        }
    }
));
