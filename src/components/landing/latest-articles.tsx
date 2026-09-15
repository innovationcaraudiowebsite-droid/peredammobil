import { db } from '@/lib/db'
import { ArticlesList, type ArticleItem } from '@/components/landing/articles-list'

/**
 * LatestArticles section landing — section id="artikel".
 *
 * Batch-based scroll: 3 artikel di-render server-side (SEO friendly),
 * lalu saat user scroll/navigate, client component fetch batch berikutnya
 * via /api/articles/published?offset=xxx&limit=3. 3 card tetap (replace,
 * bukan append).
 *
 * Server component — ambil 3 artikel pertama + total count untuk initial render.
 *
 * Sesuai brief user revisi:
 *  - Hapus link "Lihat Semua Artikel" di header section.
 *  - Prinsip sticky: hanya 3 card yang tampil. Jika di-scroll, artikel
 *    berganti (replace) dengan artikel lain dari database.
 */
export const dynamic = 'force-dynamic'

type LatestArticle = ArticleItem

async function getInitialArticles(): Promise<{
  articles: LatestArticle[]
  total: number
}> {
  try {
    // Ambil total count untuk navigation indicator
    const total = await db.article.count({ where: { status: 'PUBLISHED' } })

    // Ambil 3 artikel pertama (batch 0)
    const items = (await db.article.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 3,
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

    return { articles: items, total }
  } catch (err) {
    console.error('[latest-articles] DB error:', err)
    return { articles: [], total: 0 }
  }
}

export async function LatestArticles() {
  const { articles, total } = await getInitialArticles()

  return (
    <section
      id="artikel"
      className="border-t border-border bg-muted/30"
    >
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:py-16 lg:py-20">
        {/* Section header — tanpa link "Lihat Semua Artikel" (dihapus sesuai brief) */}
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Artikel Terbaru
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Tips &amp; panduan seputar peredam mobil. Scroll untuk lihat artikel lainnya.
          </p>
        </div>

        {/* Articles list dengan batch-based scroll (3 card tetap, berganti saat scroll) */}
        <ArticlesList
          initialArticles={articles as ArticleItem[]}
          initialTotal={total}
        />
      </div>
    </section>
  )
}

// Re-export untuk konsistensi API
export type { ArticleItem } from '@/components/landing/articles-list'
