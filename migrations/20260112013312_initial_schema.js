/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        // Tabela Users
        .createTable('users', (table) => {
            table.increments('id').primary();
            table.string('username').unique();
            table.string('email').unique();
            table.string('password');
            table.string('google_id').unique();
            table.integer('is_confirmed').defaultTo(0);
            table.string('subscription_type').defaultTo('none');
            table.bigInteger('subscription_end_date');
            table.bigInteger('last_login_date');
            table.integer('free_plays_used').defaultTo(0);
            table.integer('show_welcome_modal').defaultTo(1);
            table.string('role').defaultTo('user');
            table.bigInteger('created_at');
        })
        // Tabela Email Confirmations
        .createTable('email_confirmations', (table) => {
            table.increments('id').primary();
            table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
            table.string('token').unique();
            table.bigInteger('expires_at');
        })
        // Tabela Password Resets
        .createTable('password_resets', (table) => {
            table.increments('id').primary();
            table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
            table.string('token').unique();
            table.bigInteger('expires_at');
        })
        // Tabela Game Plays
        .createTable('game_plays', (table) => {
            table.increments('id').primary();
            table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
            table.string('game_id');
            table.bigInteger('start_time');
            table.bigInteger('end_time'); // Pode ser null se o jogo crashar ou user fechar aba
            table.integer('duration_seconds');
            table.integer('is_free_trial').defaultTo(0);
        })
        // Tabela User Favorites
        .createTable('user_favorites', (table) => {
            table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
            table.string('game_id');
            table.bigInteger('created_at');
            table.primary(['user_id', 'game_id']);
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema
        .dropTableIfExists('user_favorites')
        .dropTableIfExists('game_plays')
        .dropTableIfExists('password_resets')
        .dropTableIfExists('email_confirmations')
        .dropTableIfExists('users');
};
