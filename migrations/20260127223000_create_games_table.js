/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('games', (table) => {
        table.string('id').primary(); // Slug como ID (ex: 'tabela-periodica-bingo')
        table.string('title').notNullable();
        table.text('description');
        table.string('thumbnail');
        table.string('game_url');
        table.string('printable_url');
        table.boolean('is_premium').defaultTo(false);
        table.boolean('is_featured').defaultTo(false);
        table.string('category');
        table.timestamps(true, true); // created_at, updated_at
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('games');
};
