/**
 * Migration: Enable RLS on all public tables
 * Fixes 14 security vulnerabilities reported by Supabase Security Advisor
 *
 * Strategy:
 * - Internal tables (knex_migrations, session): RLS ON, no policies = blocks all PostgREST access
 * - Sensitive tables (users, email_confirmations, password_resets, processed_payments): service_role only
 * - Business tables (games, game_plays, user_favorites): role-based policies
 * - system_settings: public read, no write via API
 *
 * NOTE: Backend uses direct Postgres connection (Knex), so RLS does NOT affect server-side operations.
 * These policies only protect the Supabase REST/PostgREST API from unauthorized direct access.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.raw(`
        -- ============================================================
        -- 1. INTERNAL TABLES — Enable RLS, no policies (blocks all)
        -- ============================================================

        ALTER TABLE public.knex_migrations ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.knex_migrations_lock ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.session ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.atualiza ENABLE ROW LEVEL SECURITY;

        -- ============================================================
        -- 2. SENSITIVE TABLES — Enable RLS, no public policies
        --    (Only service_role bypasses RLS — used by backend)
        -- ============================================================

        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.email_confirmations ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.processed_payments ENABLE ROW LEVEL SECURITY;

        -- ============================================================
        -- 3. GAMES — Public read, no write via API
        -- ============================================================

        ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "games_public_read" ON public.games;
        CREATE POLICY "games_public_read"
            ON public.games
            FOR SELECT
            TO anon, authenticated
            USING (true);

        -- ============================================================
        -- 4. GAME_PLAYS — Users can only read/insert their own records
        -- ============================================================

        ALTER TABLE public.game_plays ENABLE ROW LEVEL SECURITY;

        -- game_plays is managed exclusively by the backend (service_role).
        -- No direct client access needed.

        -- ============================================================
        -- 5. USER_FAVORITES — Users manage only their own favorites
        -- ============================================================

        ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

        -- user_favorites is managed exclusively by the backend (service_role).
        -- No direct client access needed.

        -- ============================================================
        -- 6. SYSTEM_SETTINGS — Public read only, no write via API
        -- ============================================================

        ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "system_settings_public_read" ON public.system_settings;
        CREATE POLICY "system_settings_public_read"
            ON public.system_settings
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
        -- Remove policies
        DROP POLICY IF EXISTS "games_public_read" ON public.games;
        DROP POLICY IF EXISTS "system_settings_public_read" ON public.system_settings;

        -- Disable RLS on all tables
        ALTER TABLE public.knex_migrations DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.knex_migrations_lock DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.session DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.email_confirmations DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.password_resets DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.processed_payments DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.games DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.game_plays DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.user_favorites DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;
    `);
};
