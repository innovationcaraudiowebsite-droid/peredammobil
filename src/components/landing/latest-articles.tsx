import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { db } from '@/lib/db'
import {
  type PortalCategory,
} from '@/lib/portal'
import { ArticlesList, type ArticleItem } from '@/components/landing/articles-list'

/**
 * LatestArticles section landing — section id="artikel".
 *
 * Infinite scroll: initial 3 artikel di-render server-side (SEO friendly),
 * lalu saat user scroll ke bawah, client component fetch artikel berikutnya
 * via /api/articles/published?cursor=xxx.
 *
 * Server component — ambil 3 artikel pertama untuk initial render.
 */
export const dynamic = 'force-dynamic'

type LatestArticle = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  featuredImageUrl: string | null
  featuredImageAlt: string | null
  authorName: string
  readingTimeMinutes: number
  viewCount: number
  publishedAt: Date | null
  isFeatured: boolean
  isBreaking: boolean
  categoryId: string
  category: PortalCategory
  tags: { id: string; name: string; slug: string }[]
}

async function getInitialArticles(): Promise<{
  articles: LatestArticle[]
  nextCursor: { publishedAt: string; id: string } | null
}> {
  try {
    // Ambil 4 artikel (3 untuk initial + 1 untuk cek hasMore)
    const items = (await db.article.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 4,
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
    } as never)) as LatestArticle[]

    if (items.length === 0) {
      return { articles: [], nextCursor: null }
    }

    const hasMore = items.length > 3
    const initialArticles = hasMore ? items.slice(0, 3) : items

    // Compute nextCursor dari artikel terakhir initial (artikel ke-3)
    let nextCursor: { publishedAt: string; id: string } | null = null
    if (hasMore && initialArticles.length > 0) {
      const last = initialArticles[initialArticles.length - 1]
      nextCursor = {
        publishedAt: last.publishedAt instanceof Date
          ? last.publishedAt.toISOString()
          : (last.publishedAt || new Date().toISOString()),
        id: last.id,
      }
    }

    return { articles: initialArticles, nextCursor }
  } catch (err) {
    console.error('[latest-articles] DB error:', err)
    return { articles: [], nextCursor: null }
  }
}

export async function LatestArticles() {
  const { articles, nextCursor } = await getInitialArticles()

  return (
    <section
      id="artikel"
      className="border-t border-border bg-muted/30"
    >
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:py-16 lg:py-20">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Artikel Terbaru
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Tips &amp; panduan seputar peredam mobil. Scroll untuk lihat artikel lainnya.
            </p>
          </div>
          <Link
            href="/berita"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand dark:text-brand-light hover:gap-2.5 transition-all"
          >
            Lihat Semua Artikel
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Articles list dengan infinite scroll */}
        <ArticlesList
          initialArticles={articles as ArticleItem[]}
          initialCursor={nextCursor}
        />
      </div>
    </section>
  )
}

// Re-export untuk konsistensi API
export type { ArticleItem } from '@/components/landing/articles-list'
