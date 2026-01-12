const db = require('../database');

<<<<<<< HEAD
// Model usando Knex Query Builder
// Muito mais limpo, seguro e portável entre bancos (Postgres/MySQL/SQLite)

const findUserByUsername = async (username) => {
    return await db('users')
        .select('id', 'username', 'password', 'role', 'show_welcome_modal')
        .where('username', username)
        .first();
};

const findUserByEmail = async (email) => {
    return await db('users')
        .select('id', 'username')
        .where('email', email)
        .first();
};

const createUser = async ({ username, email, hash }) => {
    const now = Date.now();
    const [result] = await db('users').insert({
        username,
        email,
        password: hash,
        subscription_type: 'none',
        last_login_date: now,
        created_at: now
    }).returning('id');

    // Compatibilidade: Postgres retorna {id: 1}, SQLite pode retornar 1 ou {id: 1} dependendo da versão/knex
    const id = (result && typeof result === 'object') ? result.id : result;

    return { id };
};

const createEmailConfirmationToken = async ({ userId, token, expiresAt }) => {
    const [result] = await db('email_confirmations').insert({
        user_id: userId,
        token,
        expires_at: expiresAt
    }).returning('id');

    const id = (result && typeof result === 'object') ? result.id : result;

    return { id };
};

const updateUserLastLogin = async (userId) => {
    await db('users')
        .where('id', userId)
        .update({ last_login_date: Date.now() });
};

const disableWelcomeModal = async (userId) => {
    await db('users')
        .where('id', userId)
        .update({ show_welcome_modal: 0 });
};

const createPasswordResetToken = async ({ userId, token, expiresAt }) => {
    await db('password_resets').insert({
        user_id: userId,
        token,
        expires_at: expiresAt
    });
=======
// Todas as funções foram convertidas para async/await para lidar com as Promises do pg.
// Os placeholders '?' foram trocados por $1, $2, etc., que é o padrão do PostgreSQL.

const findUserByUsername = async (username) => {
    const sql = 'SELECT id, username, password, role, show_welcome_modal FROM users WHERE username = $1';
    const { rows } = await db.query(sql, [username]);
    return rows[0]; // Retorna o primeiro usuário encontrado ou undefined
};

const findUserByEmail = async (email) => {
    const sql = 'SELECT id, username FROM users WHERE email = $1';
    const { rows } = await db.query(sql, [email]);
    return rows[0];
};

const createUser = async ({ username, email, hash }) => {
    const now = new Date();
    // A cláusula RETURNING id é uma feature do PostgreSQL para retornar o ID do registro inserido.
    const sql = 'INSERT INTO users (username, email, password, subscription_type, last_login_date, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id';
    const { rows } = await db.query(sql, [username, email, hash, 'none', now, now]);
    return rows[0]; // Retorna { id: new_user_id }
};

const createEmailConfirmationToken = async ({ userId, token, expiresAt }) => {
    const sql = 'INSERT INTO email_confirmations (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING id';
    const { rows } = await db.query(sql, [userId, token, expiresAt]);
    return rows[0];
};

const updateUserLastLogin = async (userId) => {
    await db.query('UPDATE users SET last_login_date = $1 WHERE id = $2', [new Date(), userId]);
};

const disableWelcomeModal = async (userId) => {
    await db.query('UPDATE users SET show_welcome_modal = false WHERE id = $1', [userId]);
};

const createPasswordResetToken = async ({ userId, token, expiresAt }) => {
    const sql = 'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)';
    await db.query(sql, [userId, token, expiresAt]);
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
};

const findResetToken = async (token) => {
    const now = Date.now();
<<<<<<< HEAD
    return await db('password_resets')
        .where('token', token)
        .where('expires_at', '>', now)
        .select('user_id')
        .first();
};

const updateUserPassword = async ({ userId, hash }) => {
    await db('users')
        .where('id', userId)
        .update({ password: hash });
};

const deletePasswordResetToken = async (token) => {
    await db('password_resets')
        .where('token', token)
        .del();
=======
    const sql = 'SELECT user_id FROM password_resets WHERE token = $1 AND expires_at > $2';
    const { rows } = await db.query(sql, [token, now]);
    return rows[0];
};

const updateUserPassword = async ({ userId, hash }) => {
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hash, userId]);
};

const deletePasswordResetToken = async (token) => {
    await db.query('DELETE FROM password_resets WHERE token = $1', [token]);
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
};

const findEmailConfirmationToken = async (token) => {
    const now = Date.now();
<<<<<<< HEAD
    return await db('email_confirmations')
        .where('token', token)
        .where('expires_at', '>', now)
        .select('user_id')
        .first();
};

const confirmUserEmail = async (userId) => {
    await db('users')
        .where('id', userId)
        .update({ is_confirmed: 1 });
};

const deleteEmailConfirmationToken = async (token) => {
    await db('email_confirmations')
        .where('token', token)
        .del();
};

=======
    const sql = 'SELECT user_id FROM email_confirmations WHERE token = $1 AND expires_at > $2';
    const { rows } = await db.query(sql, [token, now]);
    return rows[0];
};

const confirmUserEmail = async (userId) => {
    await db.query('UPDATE users SET is_confirmed = true WHERE id = $1', [userId]);
};

const deleteEmailConfirmationToken = async (token) => {
    await db.query('DELETE FROM email_confirmations WHERE token = $1', [token]);
};


>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
module.exports = {
    findUserByUsername,
    findUserByEmail,
    createUser,
    createEmailConfirmationToken,
    updateUserLastLogin,
    disableWelcomeModal,
    createPasswordResetToken,
    findResetToken,
    updateUserPassword,
    deletePasswordResetToken,
    findEmailConfirmationToken,
    confirmUserEmail,
    deleteEmailConfirmationToken
<<<<<<< HEAD
};
=======
};
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
