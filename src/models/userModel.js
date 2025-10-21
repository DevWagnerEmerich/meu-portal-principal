const db = require('../database');

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
};

const findResetToken = async (token) => {
    const now = Date.now();
    const sql = 'SELECT user_id FROM password_resets WHERE token = $1 AND expires_at > $2';
    const { rows } = await db.query(sql, [token, now]);
    return rows[0];
};

const updateUserPassword = async ({ userId, hash }) => {
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hash, userId]);
};

const deletePasswordResetToken = async (token) => {
    await db.query('DELETE FROM password_resets WHERE token = $1', [token]);
};

const findEmailConfirmationToken = async (token) => {
    const now = Date.now();
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