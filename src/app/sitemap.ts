import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'

/**
 * Dynamic sitemap.xml generator — Next.js 16 native.
 *
 * Output URL: https://peredammobiljakarta.com/sitemap.xml
 *
 * Includes:
 *  - Static homepage + search page
 *  - Category listing pages
 *  - All published articles (slug under /berita/{category}/{slug})
 *  - All tag pages (search results filtered by tag)
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://peredammobil.vercel.app')
  const now = new Date()

  // ----- Static pages -----
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pencarian`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ]

  // ----- Categories -----
  let categoryUrls: MetadataRoute.Sitemap = []
  try {
    const categories = await db.category.findMany({
      select: { slug: true, updatedAt: true },
    })
    categoryUrls = categories.map((c) => ({
      url: `${baseUrl}/kategori/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch {
    // DB not ready — skip categories.
  }

  // ----- Articles (PUBLISHED, publishedAt <= now) -----
  let articleUrls: MetadataRoute.Sitemap = []
  try {
    const articles = await db.article.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { lte: now },
      },
      select: {
        slug: true,
        updatedAt: true,
        isFeatured: true,
        category: { select: { slug: true } },
      },
    })
    articleUrls = articles.map((a) => ({
      url: `${baseUrl}/berita/${a.category.slug}/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: a.isFeatured ? 0.9 : 0.8,
    }))
  } catch {
    // DB not ready — skip articles.
  }

  // ----- Tags -----
  let tagUrls: MetadataRoute.Sitemap = []
  try {
    const tags = await db.tag.findMany({ select: { slug: true, name: true } })
    tagUrls = tags.map((t) => ({
      url: `${baseUrl}/pencarian?tag=${encodeURIComponent(t.slug)}`,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }))
  } catch {
    // DB not ready — skip tags.
  }

  return [...staticPages, ...categoryUrls, ...articleUrls, ...tagUrls]
}
