import { MetadataRoute } from 'next';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://brincabytes.vercel.app'; // Força o domínio grátis do Vercel para o Google Search Console

    // Rotas estáticas
    const staticRoutes = [
        '',
        '/login',
        '/register',
        '/subscription',
        '/forgot-password'
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Buscar rotas dinâmicas de jogos diretamente do banco de dados (Evita loop de fetch no Vercel SSR)
    let gameRoutes: MetadataRoute.Sitemap = [];
    let pool: Pool | null = null;

    try {
        if (process.env.DATABASE_URL) {
            // Ajuste para conexão do Supabase com PgBouncer no ambiente serverless
            let connectionString = process.env.DATABASE_URL;
            if (connectionString.includes('pooler.supabase.com') && connectionString.includes(':5432')) {
                connectionString = connectionString.replace(':5432', ':6543');
                if (!connectionString.includes('pgbouncer=true')) {
                    connectionString += (connectionString.includes('?') ? '&' : '?') + 'pgbouncer=true';
                }
            }

            pool = new Pool({
                connectionString,
                ssl: { rejectUnauthorized: false }
            });

            const result = await pool.query('SELECT id, updated_at, is_featured FROM games WHERE id IS NOT NULL');
            const games = result.rows;

            gameRoutes = games.map((game: any) => ({
                url: `${baseUrl}/play/${game.id}`,
                lastModified: new Date(game.updated_at || Date.now()),
                changeFrequency: 'weekly' as const,
                priority: game.is_featured ? 0.9 : 0.7,
            }));
        }
    } catch (error) {
        console.error('Failed to generate sitemap for games from DB:', error);
    } finally {
        if (pool) {
            await pool.end().catch(console.error);
        }
    }

    return [...staticRoutes, ...gameRoutes];
}
