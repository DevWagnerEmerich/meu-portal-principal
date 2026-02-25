/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('system_settings', (table) => {
        table.string('key').primary();
        table.text('value');
        table.string('type').defaultTo('string'); // string, number, boolean, json
        table.text('description');
        table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('system_settings');
};
