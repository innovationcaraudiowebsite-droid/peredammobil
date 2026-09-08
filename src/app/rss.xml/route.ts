import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * GET /rss.xml — RSS 2.0 feed of latest 20 published articles.
 *
 * Output: application/rss+xml
 */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const baseUrl = 'https://peredammobiljakarta.com'
  const siteName = 'Peredam Mobil Jakarta'
  const siteDescription =
    'Portal media niche otomotif yang membahas peredam mobil, upgrade audio, review workshop Jakarta, tips & biaya pemasangan.'

  let items: {
    title: string
    slug: string
    excerpt: string | null
    publishedAt: Date | null
    categoryName: string
    categorySlug: string
  }[] = []

  try {
    const raw = await db.article.findMany({
      where: { status: 'PUBLISHED', publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: 'desc' },
      take: 20,
      select: {
        title: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
        category: { select: { name: true, slug: true } },
      },
    })
    items = raw.map((a) => ({
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      publishedAt: a.publishedAt,
      categoryName: (a.category as { name: string }).name,
      categorySlug: (a.category as { slug: string }).slug,
    }))
  } catch {
    // DB not ready → return feed with channel only (no items).
  }

  const now = new Date().toUTCString()

  const itemsXml = items
    .map((a) => {
      const url = `${baseUrl}/berita/${a.categorySlug}/${a.slug}`
      const pubDate = a.publishedAt ? new Date(a.publishedAt).toUTCString() : now
      const description = escapeXml(
        (a.excerpt || '').slice(0, 300) || siteDescription,
      )
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
      <category>${escapeXml(a.categoryName)}</category>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>id-ID</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${escapeXml(baseUrl + '/rss.xml')}" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
