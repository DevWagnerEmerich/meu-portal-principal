/**
 * Migration: Create game_user_data table for persistent game state.
 * Allows games to save custom lists, progress, and preferences per user.
 * 
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
    return knex.schema.createTable('game_user_data', (table) => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('game_id').notNullable(); // Slug do jogo
        table.string('data_key').notNullable(); // Ex: 'custom_list', 'high_score'
        table.text('data_value'); // JSON stringificado
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        // Índice único para evitar duplicatadas e facilitar o 'upsert'
        table.unique(['user_id', 'game_id', 'data_key']);
    });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
    return knex.schema.dropTable('game_user_data');
};
