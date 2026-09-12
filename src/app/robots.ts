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
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://peredammobiljakarta.com'
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
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
