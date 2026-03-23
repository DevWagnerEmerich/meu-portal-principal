/**
 * Migration: Add RLS bypass policies for postgres role (backend service account).
 *
 * Problem: PgBouncer in transaction pooling mode blocks SET LOCAL role commands
 * that Supabase uses internally when applying RLS. This causes 500 errors when
 * the backend tries to INSERT/UPDATE/SELECT on RLS-enabled tables.
 *
 * Solution: The `postgres` role is the service role (superuser equivalent) used
 * exclusively by the backend via DATABASE_URL. Adding ALL policies for it is safe
 * and doesn't expose data to end-users — they never connect as `postgres`.
 *
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
    return knex.raw(`
        -- game_plays: backend needs INSERT (record play) and SELECT (count daily plays)
        DROP POLICY IF EXISTS "backend_all_game_plays" ON public.game_plays;
        CREATE POLICY "backend_all_game_plays"
            ON public.game_plays
            FOR ALL
            TO postgres
            USING (true)
            WITH CHECK (true);

        -- users: backend needs SELECT (auth checks) and UPDATE (subscription updates)
        DROP POLICY IF EXISTS "backend_all_users" ON public.users;
        CREATE POLICY "backend_all_users"
            ON public.users
            FOR ALL
            TO postgres
            USING (true)
            WITH CHECK (true);

        -- session: backend needs full access (connect-pg-simple session store)
        DROP POLICY IF EXISTS "backend_all_session" ON public.session;
        CREATE POLICY "backend_all_session"
            ON public.session
            FOR ALL
            TO postgres
            USING (true)
            WITH CHECK (true);

        -- email_confirmations: backend needs INSERT/SELECT/DELETE
        DROP POLICY IF EXISTS "backend_all_email_confirmations" ON public.email_confirmations;
        CREATE POLICY "backend_all_email_confirmations"
            ON public.email_confirmations
            FOR ALL
            TO postgres
            USING (true)
            WITH CHECK (true);

        -- password_resets: backend needs INSERT/SELECT/DELETE
        DROP POLICY IF EXISTS "backend_all_password_resets" ON public.password_resets;
        CREATE POLICY "backend_all_password_resets"
            ON public.password_resets
            FOR ALL
            TO postgres
            USING (true)
            WITH CHECK (true);

        -- user_favorites: backend needs full access
        DROP POLICY IF EXISTS "backend_all_user_favorites" ON public.user_favorites;
        CREATE POLICY "backend_all_user_favorites"
            ON public.user_favorites
            FOR ALL
            TO postgres
            USING (true)
            WITH CHECK (true);

        -- processed_payments: backend needs INSERT/SELECT
        DROP POLICY IF EXISTS "backend_all_processed_payments" ON public.processed_payments;
        CREATE POLICY "backend_all_processed_payments"
            ON public.processed_payments
            FOR ALL
            TO postgres
            USING (true)
            WITH CHECK (true);

        -- games: backend needs full access (admin CRUD)
        DROP POLICY IF EXISTS "backend_all_games" ON public.games;
        CREATE POLICY "backend_all_games"
            ON public.games
            FOR ALL
            TO postgres
            USING (true)
            WITH CHECK (true);

        -- system_settings: backend needs SELECT and UPDATE
        DROP POLICY IF EXISTS "backend_all_system_settings" ON public.system_settings;
        CREATE POLICY "backend_all_system_settings"
            ON public.system_settings
            FOR ALL
            TO postgres
            USING (true)
            WITH CHECK (true);

        -- game_user_data: backend needs full access
        DROP POLICY IF EXISTS "backend_all_game_user_data" ON public.game_user_data;
        CREATE POLICY "backend_all_game_user_data"
            ON public.game_user_data
            FOR ALL
            TO postgres
            USING (true)
            WITH CHECK (true);

        -- knex_migrations / knex_migrations_lock: backend needs full access (run migrations)
        DROP POLICY IF EXISTS "backend_all_knex_migrations" ON public.knex_migrations;
        CREATE POLICY "backend_all_knex_migrations"
            ON public.knex_migrations
            FOR ALL
            TO postgres
            USING (true)
            WITH CHECK (true);

        DROP POLICY IF EXISTS "backend_all_knex_migrations_lock" ON public.knex_migrations_lock;
        CREATE POLICY "backend_all_knex_migrations_lock"
            ON public.knex_migrations_lock
            FOR ALL
            TO postgres
            USING (true)
            WITH CHECK (true);
    `);
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
    return knex.raw(`
        DROP POLICY IF EXISTS "backend_all_game_plays" ON public.game_plays;
        DROP POLICY IF EXISTS "backend_all_users" ON public.users;
        DROP POLICY IF EXISTS "backend_all_session" ON public.session;
        DROP POLICY IF EXISTS "backend_all_email_confirmations" ON public.email_confirmations;
        DROP POLICY IF EXISTS "backend_all_password_resets" ON public.password_resets;
        DROP POLICY IF EXISTS "backend_all_user_favorites" ON public.user_favorites;
        DROP POLICY IF EXISTS "backend_all_processed_payments" ON public.processed_payments;
        DROP POLICY IF EXISTS "backend_all_games" ON public.games;
        DROP POLICY IF EXISTS "backend_all_system_settings" ON public.system_settings;
        DROP POLICY IF EXISTS "backend_all_game_user_data" ON public.game_user_data;
        DROP POLICY IF EXISTS "backend_all_knex_migrations" ON public.knex_migrations;
        DROP POLICY IF EXISTS "backend_all_knex_migrations_lock" ON public.knex_migrations_lock;
    `);
};
