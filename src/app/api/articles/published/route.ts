import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/articles/published — list artikel PUBLISHED dengan offset
 * pagination untuk batch-based scroll di landing page Section 5.
 *
 * Query params:
 *  - offset: number — offset artikel (0, 3, 6, dst). Default 0.
 *  - limit: number — default 3, max 10.
 *
 * Response:
 *  - articles: array artikel dengan category & tags.
 *  - total: total artikel PUBLISHED di database.
 *  - offset: offset saat ini.
 *  - limit: limit saat ini.
 *  - hasMore: boolean — ada batch berikutnya?
 *  - hasPrev: boolean — ada batch sebelumnya?
 *
 * Sort: publishedAt DESC, createdAt DESC (sama dengan query landing awal).
 *
 * Catatan: sebelumnya pakai cursor-based pagination (untuk infinite scroll
 * append). Sekarang pakai offset-based (untuk batch replace 3 card sticky).
 */
interface PublishedArticle {
  id: string
  title: string
  slug: string
  excerpt: string | null
  featuredImageUrl: string | null
  featuredImageAlt: string | null
  authorName: string
  readingTimeMinutes: number
  viewCount: number
  publishedAt: string | null
  isFeatured: boolean
  isBreaking: boolean
  categoryId: string
  category: {
    id: string
    name: string
    slug: string
    description: string | null
    color: string | null
  }
  tags: { id: string; name: string; slug: string }[]
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const offsetParam = Number.parseInt(searchParams.get('offset') || '0', 10)
  const limitParam = Number.parseInt(searchParams.get('limit') || '3', 10)
  const offset = Number.isFinite(offsetParam) ? Math.max(offsetParam, 0) : 0
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 10) : 3

  try {
    // Ambil total count untuk navigation indicator
    const total = await db.article.count({ where: { status: 'PUBLISHED' } })

    // Ambil artikel batch saat ini
    const items = (await db.article.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip: offset,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImageUrl: true,
        featuredImageAlt: true,
        authorName: true,
        readingTimeMinutes: true,
        viewCount: true,
        publishedAt: true,
        isFeatured: true,
        isBreaking: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            color: true,
          },
        },
        tags: { select: { id: true, name: true, slug: true } },
      },
    } as never)) as PublishedArticle[]

    // Serialize tanggal ke ISO string
    const serialized = items.map((a) => ({
      ...a,
      publishedAt: a.publishedAt instanceof Date
        ? a.publishedAt.toISOString()
        : a.publishedAt,
    }))

    return NextResponse.json({
      articles: serialized,
      total,
      offset,
      limit,
      hasMore: offset + limit < total,
      hasPrev: offset > 0,
    })
  } catch (err) {
    console.error('[api/articles/published] error:', err)
    return NextResponse.json(
      { articles: [], total: 0, offset, limit, hasMore: false, hasPrev: false, error: 'Failed to fetch articles' },
      { status: 200 },
    )
  }
}
