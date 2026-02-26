/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('processed_payments', function (table) {
        table.string('payment_id').primary();
        table.string('user_id').notNullable();
        table.string('plan_id').notNullable();
        table.bigInteger('processed_at').notNullable();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('processed_payments');
};
