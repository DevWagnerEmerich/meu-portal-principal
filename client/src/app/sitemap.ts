import { MetadataRoute } from 'next';
import { API_URL } from '@/lib/config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://brincabytes.com.br'; // Substitua pelo domínio real no deploy

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

    // Buscar rotas dinâmicas de jogos
    let gameRoutes: MetadataRoute.Sitemap = [];
    try {
        const response = await fetch(`${API_URL}/api/games`, { cache: 'no-store' });
        if (response.ok) {
            const games = await response.json();
            gameRoutes = games.map((game: any) => ({
                url: `${baseUrl}/play/${game.id}`,
                lastModified: new Date(game.updated_at || Date.now()),
                changeFrequency: 'weekly' as const,
                priority: game.is_featured ? 0.9 : 0.7,
            }));
        }
    } catch (error) {
        console.error('Failed to generate sitemap for games:', error);
    }

    return [...staticRoutes, ...gameRoutes];
}
