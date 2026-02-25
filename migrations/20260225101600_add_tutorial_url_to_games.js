exports.up = function (knex) {
    return knex.schema.alterTable('games', (table) => {
        table.string('tutorial_url');
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable('games', (table) => {
        table.dropColumn('tutorial_url');
    });
};
