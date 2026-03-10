/**
 * Migration: Add Mercado Pago Preapproval subscription fields to users table.
 * These are additive-only changes — zero breaking impact on existing data.
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
    return knex.schema.alterTable('users', (table) => {
        table.string('mp_preapproval_id').nullable();
        table.string('subscription_status').defaultTo('none'); // none | trial | active | past_due | canceled
        table.bigInteger('grace_period_ends_at').nullable();
    });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
    return knex.schema.alterTable('users', (table) => {
        table.dropColumn('mp_preapproval_id');
        table.dropColumn('subscription_status');
        table.dropColumn('grace_period_ends_at');
    });
};
