import { NextRequest, NextResponse } from 'next/server'
import { searchArticles } from '@/lib/portal'

export const runtime = 'nodejs'

/**
 * GET /api/search?q=...&take=...&skip=...
 *
 * Public, no auth. Cari artikel PUBLISHED berdasarkan title/excerpt/contentMarkdown/authorName.
 * Return { items, total }.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') || '').trim()
  const takeParam = url.searchParams.get('take')
  const skipParam = url.searchParams.get('skip')
  const take = takeParam ? Math.min(Math.max(parseInt(takeParam, 10) || 12, 1), 24) : 12
  const skip = skipParam ? Math.max(parseInt(skipParam, 10) || 0, 0) : 0

  if (!q) {
    return NextResponse.json({ items: [], total: 0, q: '' })
  }
  try {
    const { items, total } = await searchArticles(q, take, skip)
    return NextResponse.json({
      items: items.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        featuredImageUrl: a.featuredImageUrl,
        authorName: a.authorName,
        publishedAt: a.publishedAt,
        readingTimeMinutes: a.readingTimeMinutes,
        viewCount: a.viewCount,
        category: a.category,
      })),
      total,
      q,
    })
  } catch (err) {
    console.error('search error', err)
    return NextResponse.json(
      { items: [], total: 0, q, message: 'Gagal melakukan pencarian.' },
      { status: 500 },
    )
  }
}
