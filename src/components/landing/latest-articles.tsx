import Link from 'next/link'
import Image from 'next/image'
import { CalendarDays, Clock, ArrowRight } from 'lucide-react'
import { db } from '@/lib/db'
import {
  categoryBadgeClass,
  type PortalCategory,
} from '@/lib/portal'
import { formatTanggalPendek } from '@/lib/format-tanggal'

/**
 * LatestArticles section landing — section id="artikel".
 * Query 4 artikel terbaru dari DB, render sebagai vertical list
 * (gambar kecil kiri 120×80 + konten kanan).
 *
 * Server component.
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

/**
 * Truncate excerpt to ~100 chars (tanpa memotong kata di tengah).
 */
function truncate(s: string, max = 100): string {
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + '…'
}

async function getLatestThreeArticles(): Promise<LatestArticle[]> {
  try {
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
    return items ?? []
  } catch (err) {
    console.error('[latest-articles] DB error:', err)
    return []
  }
}

export async function LatestArticles() {
  const articles = await getLatestThreeArticles()

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
              Tips &amp; panduan seputar peredam mobil.
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

        {/* Vertical list */}
        {articles.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Belum ada artikel.
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {articles.map((a) => {
              const href = `/berita/${a.category.slug}/${a.slug}`
              const badge = categoryBadgeClass(a.category.color)
              const alt = a.featuredImageAlt || a.title
              const hasImage = Boolean(a.featuredImageUrl)
              const dateLabel = formatTanggalPendek(a.publishedAt) || '—'
              return (
                <li
                  key={a.id}
                  className="rounded-xl border border-border bg-card p-3 sm:p-4 transition-all duration-200 hover:shadow-md hover:border-brand/40"
                >
                  <Link href={href} className="group flex gap-3 sm:gap-4 items-start">
                    {/* Gambar kecil kiri — aspect-square (1:1) supaya rasio konsisten */}
                    <div className="shrink-0 relative overflow-hidden rounded-md bg-muted border border-border w-[100px] sm:w-[120px] aspect-square">
                      {hasImage ? (
                        <Image
                          src={a.featuredImageUrl!}
                          alt={alt}
                          fill
                          sizes="(min-width: 640px) 120px, 100px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-brand/30 to-brand-dark/40">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
                            Peredam Mobil
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Konten kanan */}
                    <div className="min-w-0 flex-1 pt-0.5">
                      {/* Meta: badge kategori + tanggal + read time */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge}`}
                        >
                          {a.category.name}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="size-3" />
                          {dateLabel}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" />
                          {a.readingTimeMinutes} mnt
                        </span>
                      </div>

                      {/* Title (2-line clamp) */}
                      <h3 className="mt-1.5 font-semibold leading-snug line-clamp-2 group-hover:text-brand dark:group-hover:text-brand-light transition-colors">
                        {a.title}
                      </h3>

                      {/* Excerpt 100 char */}
                      {a.excerpt && (
                        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                          {truncate(a.excerpt, 100)}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
