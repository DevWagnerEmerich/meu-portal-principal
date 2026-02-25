import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/'],
        },
        sitemap: 'https://brincabytes.vercel.app/sitemap.xml', // Domínio Vercel travado para o Search Console
    };
}
