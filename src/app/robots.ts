import type { MetadataRoute } from 'next'

/**
 * Dynamic robots.txt generator.
 *
 * Output URL: https://peredammobiljakarta.com/robots.txt
 *
 * Rules:
 *  - Allow all public bots to crawl everything except /admin & /api/admin.
 *  - Sitemap + host hints included for SEO.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/admin'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin', '/api/admin'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/admin', '/api/admin'],
      },
    ],
    sitemap: 'https://peredammobiljakarta.com/sitemap.xml',
    host: 'https://peredammobiljakarta.com',
  }
}
