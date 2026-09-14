'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CalendarDays, Clock, Loader2 } from 'lucide-react'
import {
  categoryBadgeClass,
  type PortalCategory,
} from '@/lib/portal'
import { formatTanggalPendek } from '@/lib/format-tanggal'

/**
 * ArticlesList — client component untuk render list artikel dengan
 * infinite scroll.
 *
 * Initial 3 artikel di-render server-side (passed via initialArticles),
 * lalu saat user scroll ke card terakhir, fetch artikel berikutnya via
 * /api/articles/published?cursor=xxx&cursorId=xxx.
 *
 * Behavior:
 *  - Initial render: 3 card artikel (SSR).
 *  - IntersectionObserver watch card terakhir. Saat visible, fetch
 *    artikel berikutnya (limit 3).
 *  - Loading: skeleton card placeholder saat fetch.
 *  - End state: "✓ Semua artikel sudah dimuat" kalau hasMore=false.
 *  - Error: "Gagal memuat artikel lainnya. Coba lagi." dengan retry.
 */

export type ArticleItem = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  featuredImageUrl: string | null
  featuredImageAlt: string | null
  authorName: string
  readingTimeMinutes: number
  viewCount: number
  publishedAt: Date | string | null
  isFeatured: boolean
  isBreaking: boolean
  categoryId: string
  category: PortalCategory
  tags: { id: string; name: string; slug: string }[]
}

interface ArticlesListProps {
  initialArticles: ArticleItem[]
  initialCursor: { publishedAt: string; id: string } | null
}

function ArticleCard({ a }: { a: ArticleItem }) {
  const href = `/berita/${a.category.slug}/${a.slug}`
  const badge = categoryBadgeClass(a.category.color)
  const alt = a.featuredImageAlt || a.title
  const hasImage = Boolean(a.featuredImageUrl)
  const publishedDate = a.publishedAt instanceof Date ? a.publishedAt : (a.publishedAt ? new Date(a.publishedAt) : null)
  const dateLabel = formatTanggalPendek(publishedDate) || '—'

  return (
    <li
      key={a.id}
      className="rounded-xl border border-border bg-card p-3 sm:p-4 transition-all duration-200 hover:shadow-md hover:border-brand/40"
    >
      <Link href={href} className="group flex gap-3 sm:gap-4 items-start">
        {/* Gambar kecil kiri — aspect-square */}
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

        {/* Konten kanan — title saja, no excerpt (sesuai brief) */}
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

          {/* Title (2-line clamp + min-h supaya konsisten tinggi) */}
          <h3 className="mt-1.5 font-semibold leading-snug line-clamp-2 min-h-[2.6rem] group-hover:text-brand dark:group-hover:text-brand-light transition-colors">
            {a.title}
          </h3>
        </div>
      </Link>
    </li>
  )
}

function SkeletonCard() {
  return (
    <li className="rounded-xl border border-border bg-card p-3 sm:p-4 animate-pulse">
      <div className="flex gap-3 sm:gap-4 items-start">
        <div className="shrink-0 w-[100px] sm:w-[120px] aspect-square rounded-md bg-muted" />
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="flex gap-2">
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
            <div className="h-4 w-10 rounded bg-muted" />
          </div>
          <div className="h-5 w-3/4 rounded bg-muted" />
          <div className="h-5 w-1/2 rounded bg-muted" />
        </div>
      </div>
    </li>
  )
}

export function ArticlesList({ initialArticles, initialCursor }: ArticlesListProps) {
  const [articles, setArticles] = useState<ArticleItem[]>(initialArticles)
  const [cursor, setCursor] = useState<{ publishedAt: string; id: string } | null>(initialCursor)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(!!initialCursor)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false) // guard supaya tidak double-fetch

  const fetchMore = useCallback(async () => {
    if (loadingRef.current || !cursor || !hasMore) return
    loadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const url = `/api/articles/published?cursor=${encodeURIComponent(cursor.publishedAt)}&cursorId=${cursor.id}&limit=3`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      if (data.articles && data.articles.length > 0) {
        setArticles((prev) => [...prev, ...data.articles])
        setCursor(data.nextCursor)
        setHasMore(data.hasMore)
      } else {
        setHasMore(false)
        setCursor(null)
      }
    } catch (err) {
      console.error('[articles-list] fetch error:', err)
      setError('Gagal memuat artikel lainnya.')
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [cursor, hasMore])

  // IntersectionObserver untuk trigger fetch saat sentinel visible
  useEffect(() => {
    if (!hasMore) return
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMore()
        }
      },
      { rootMargin: '200px' } // trigger 200px sebelum sentinel terlihat
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchMore, hasMore])

  if (articles.length === 0) {
    return (
      <div className="mt-10 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Belum ada artikel.
      </div>
    )
  }

  return (
    <>
      <ul className="mt-8 space-y-4">
        {articles.map((a) => (
          <ArticleCard key={a.id} a={a} />
        ))}

        {/* Skeleton saat loading */}
        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}
      </ul>

      {/* Sentinel untuk IntersectionObserver */}
      {hasMore && (
        <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Memuat artikel lainnya...
        </div>
      )}

      {/* Error state dengan retry */}
      {error && !loading && (
        <div className="mt-4 flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => fetchMore()}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* End state — semua artikel sudah dimuat */}
      {!hasMore && !loading && !error && articles.length > 0 && (
        <div className="mt-6 text-center text-xs text-muted-foreground">
          ✓ Semua artikel sudah dimuat ({articles.length} artikel)
        </div>
      )}
    </>
  )
}
