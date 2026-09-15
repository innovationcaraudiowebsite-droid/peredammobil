'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CalendarDays, Clock, Loader2, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { categoryBadgeClass } from '@/lib/category-badge'
import { formatTanggalPendek } from '@/lib/format-tanggal'

/**
 * ArticlesList — client component untuk render 3 card artikel dengan
 * batch-based scroll (sticky 3 card, konten berganti saat navigate).
 *
 * Sesuai brief user revisi:
 *  - Prinsip sticky: hanya 3 card yang tampil.
 *  - Jika di-scroll, artikel berganti (replace) dengan artikel lain
 *    dari database.
 *  - Navigation indicator: "Artikel X-Y dari N" + progress bar.
 *
 * Behavior:
 *  - Initial render: 3 card (SSR dari server component).
 *  - Tombol "← Sebelumnya" / "Berikutnya →" untuk manual navigate.
 *  - IntersectionObserver sentinel bawah → auto-advance ke batch
 *    berikutnya (replace 3 card).
 *  - Saat ganti batch: card fade out → fetch → card fade in.
 *  - End state: "✓ Sampai artikel terakhir" kalau batch terakhir.
 *  - Error: "Gagal memuat artikel. Coba lagi." dengan retry.
 *
 * NOTE: Jangan import dari @/lib/portal (server-only). Pakai
 * @/lib/category-badge (client-safe) untuk badge class.
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
  category: {
    id: string
    name: string
    slug: string
    description: string | null
    color: string | null
  }
  tags: { id: string; name: string; slug: string }[]
}

interface ArticlesListProps {
  initialArticles: ArticleItem[]
  initialTotal: number
}

const BATCH_SIZE = 3

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

export function ArticlesList({ initialArticles, initialTotal }: ArticlesListProps) {
  const [currentArticles, setCurrentArticles] = useState<ArticleItem[]>(initialArticles)
  const [offset, setOffset] = useState(0)
  const [total] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fadeKey, setFadeKey] = useState(0) // untuk trigger fade animation

  const sentinelRef = useRef<HTMLDivElement>(null) // kept for backward compat (unused)
  const loadingRef = useRef(false)

  const hasMore = offset + BATCH_SIZE < total
  const hasPrev = offset > 0
  const currentBatch = Math.floor(offset / BATCH_SIZE) + 1
  const totalBatches = Math.ceil(total / BATCH_SIZE)

  const fetchBatch = useCallback(async (newOffset: number) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const url = `/api/articles/published?offset=${newOffset}&limit=${BATCH_SIZE}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      if (data.articles && data.articles.length > 0) {
        setCurrentArticles(data.articles)
        setOffset(newOffset)
        setFadeKey((k) => k + 1) // trigger fade animation
      }
    } catch (err) {
      console.error('[articles-list] fetch error:', err)
      setError('Gagal memuat artikel lainnya.')
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [])

  const nextBatch = useCallback(() => {
    if (!hasMore) return
    fetchBatch(offset + BATCH_SIZE)
  }, [hasMore, offset, fetchBatch])

  const prevBatch = useCallback(() => {
    if (!hasPrev) return
    fetchBatch(offset - BATCH_SIZE)
  }, [hasPrev, offset, fetchBatch])

  // Auto-advance via wheel/scroll dengan throttle 800ms.
  // PRINSIP: setiap scroll down yang significant → ganti ke batch berikutnya
  // (REPLACE 3 card, bukan append). 3 card tetap, konten berganti.
  //
  // Bug sebelumnya: IntersectionObserver dengan rootMargin 100px terus
  // trigger nextBatch selama sentinel visible → batch langsung lompat ke
  // terakhir (artikel 40-40 dari 40) dalam 1 scroll.
  //
  // Fix: pakai wheel event dengan throttle + cooldown 800ms supaya 1 scroll
  // = 1 batch advance (tidak rapid-fire).
  useEffect(() => {
    if (!hasMore) return
    const section = document.getElementById('artikel')
    if (!section) return

    let lastTrigger = 0
    const COOLDOWN = 800 // ms — minimal jarak antar trigger

    const onWheel = (e: WheelEvent) => {
      // Hanya trigger kalau scroll DOWN (deltaY > 0)
      if (e.deltaY <= 0) return
      const now = Date.now()
      if (now - lastTrigger < COOLDOWN) return
      // Hanya trigger kalau section artikel terlihat di viewport
      const rect = section.getBoundingClientRect()
      const sectionVisible = rect.top < window.innerHeight * 0.5 && rect.bottom > window.innerHeight * 0.5
      if (!sectionVisible) return
      // Trigger next batch
      lastTrigger = now
      nextBatch()
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    return () => window.removeEventListener('wheel', onWheel)
  }, [nextBatch, hasMore])

  if (currentArticles.length === 0) {
    return (
      <div className="mt-10 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Belum ada artikel.
      </div>
    )
  }

  return (
    <>
      {/* Navigation indicator + tombol prev/next */}
      <div className="mt-6 flex items-center justify-between gap-4">
        {/* Tombol Sebelumnya */}
        <button
          type="button"
          onClick={prevBatch}
          disabled={!hasPrev || loading}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <ChevronLeft className="size-3.5" />
          Sebelumnya
        </button>

        {/* Indicator: "Artikel 1-3 dari 9" + progress bar */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Artikel {offset + 1}-{Math.min(offset + BATCH_SIZE, total)} dari {total}
          </span>
          {/* Progress bar */}
          <div className="h-1 w-32 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-brand transition-all duration-300"
              style={{ width: `${((offset + BATCH_SIZE) / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Tombol Berikutnya */}
        <button
          type="button"
          onClick={nextBatch}
          disabled={!hasMore || loading}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          Berikutnya
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      {/* 3 card artikel (replace, bukan append) — fade animation saat ganti batch */}
      <ul
        key={fadeKey}
        className="mt-6 space-y-4 animate-in fade-in duration-300"
      >
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          currentArticles.map((a) => (
            <ArticleCard key={a.id} a={a} />
          ))
        )}
      </ul>

      {/* Sentinel untuk IntersectionObserver (auto-advance) */}
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
            onClick={() => fetchBatch(offset)}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* End state — sudah sampai artikel terakhir */}
      {!hasMore && !loading && !error && (
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-emerald-500" />
          Sampai artikel terakhir (batch {currentBatch} dari {totalBatches})
        </div>
      )}
    </>
  )
}
