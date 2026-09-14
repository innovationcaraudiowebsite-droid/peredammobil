import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/articles/published — list artikel PUBLISHED dengan cursor
 * pagination untuk infinite scroll di landing page Section 5.
 *
 * Query params:
 *  - cursor: string (ISO date) — publishedAt artikel terakhir yang sudah
 *    dimuat. Artikel dengan publishedAt < cursor akan di-return.
 *  - cursorId: string — id artikel terakhir (tiebreaker kalau ada
 *    artikel dengan publishedAt sama).
 *  - limit: number — default 3, max 10.
 *
 * Response:
 *  - articles: array artikel dengan category & tags.
 *  - nextCursor: { publishedAt, id } | null — null kalau sudah artikel
 *    terakhir (no more data).
 *  - hasMore: boolean.
 *
 * Sort: publishedAt DESC, createdAt DESC (sama dengan query landing awal).
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
  const cursor = searchParams.get('cursor') // ISO date string
  const cursorId = searchParams.get('cursorId') // article id (tiebreaker)
  const limitParam = Number.parseInt(searchParams.get('limit') || '3', 10)
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 10) : 3

  try {
    // Build where clause untuk cursor pagination
    // Jika ada cursor: ambil artikel dengan publishedAt < cursor
    // Jika tidak ada cursor: ambil dari awal (initial load)
    const where: { status: string; publishedAt?: { lt: string } } = { status: 'PUBLISHED' }
    if (cursor) {
      const cursorDate = new Date(cursor)
      if (!Number.isNaN(cursorDate.getTime())) {
        where.publishedAt = { lt: cursorDate.toISOString() }
      }
    }

    // Ambil 1 extra untuk cek hasMore
    const items = (await db.article.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit + 1,
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

    const hasMore = items.length > limit
    const articles = hasMore ? items.slice(0, limit) : items

    // Filter out cursor article (kalau ada cursorId) — handle kasus
    // publishedAt sama dengan cursor.
    const filtered = cursorId
      ? articles.filter((a) => a.id !== cursorId)
      : articles

    // Compute nextCursor dari artikel terakhir
    let nextCursor: { publishedAt: string; id: string } | null = null
    if (hasMore && filtered.length > 0) {
      const last = filtered[filtered.length - 1]
      nextCursor = {
        publishedAt: last.publishedAt || new Date().toISOString(),
        id: last.id,
      }
    }

    // Serialize tanggal ke ISO string (Supabase bisa return string, Prisma return Date)
    const serialized = filtered.map((a) => ({
      ...a,
      publishedAt: a.publishedAt instanceof Date
        ? a.publishedAt.toISOString()
        : a.publishedAt,
    }))

    return NextResponse.json({
      articles: serialized,
      nextCursor,
      hasMore: !!nextCursor,
    })
  } catch (err) {
    console.error('[api/articles/published] error:', err)
    return NextResponse.json(
      { articles: [], nextCursor: null, hasMore: false, error: 'Failed to fetch articles' },
      { status: 200 }, // Return 200 dengan empty array supaya client tidak crash
    )
  }
}
