/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTableIfNotExists('session', (table) => {
        table.string('sid').primary();
        table.json('sess').notNullable();
        table.timestamp('expire', { useTz: true }).notNullable().index();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('session');
};
