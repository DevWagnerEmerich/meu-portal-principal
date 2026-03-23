/**
 * Migration: Add public read access to game_user_data for community features.
 * 
 * NOTE: This allows anyone (anon/authenticated) to SELECT from this table.
 * Private data should still be protected by application logic or more granular policies.
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.raw(`
        -- Enable SELECT for everyone on game_user_data
        DROP POLICY IF EXISTS "game_user_data_public_read" ON public.game_user_data;
        CREATE POLICY "game_user_data_public_read"
            ON public.game_user_data
            FOR SELECT
            TO anon, authenticated
            USING (true);
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.raw(`
        DROP POLICY IF EXISTS "game_user_data_public_read" ON public.game_user_data;
    `);
};
