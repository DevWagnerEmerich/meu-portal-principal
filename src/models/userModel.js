const db = require('../database');

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
};

const findResetToken = async (token) => {
    const now = Date.now();
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
};

const findEmailConfirmationToken = async (token) => {
    const now = Date.now();
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
};
