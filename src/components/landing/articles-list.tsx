'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CalendarDays, Clock, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { categoryBadgeClass } from '@/lib/category-badge'
import { formatTanggalPendek } from '@/lib/format-tanggal'

/**
 * ArticlesList — client component untuk render CAROUSEL artikel.
 *
 * PRINSIP (sesuai brief user):
 *  - Tampil artikel maksimal 2.
 *  - Saat scroll/swipe = MENGGESER artikel selanjutnya (slide animation),
 *    BUKAN reload/fetch API.
 *  - Aslinya banyak (all articles pre-loaded), tapi terlihat hanya 2.
 *  - Posisi sticky/fixed — container tetap, konten slide di dalamnya.
 *
 * Implementasi:
 *  - Semua artikel di-render di DOM (dari server, no API fetch).
 *  - Container `overflow: hidden`, fixed height untuk 2 card.
 *  - Inner track di-translate dengan CSS `transform: translateY(-N * cardHeight)`.
 *  - Scroll/swipe/wheel → increment/decrement `startIndex` → track slide.
 *  - CSS transition `duration-500 ease-out` untuk smooth animation.
 *  - NO network request — pure CSS, instant.
 *
 * Behavior:
 *  - Desktop: mouse wheel down → next 2, wheel up → prev 2.
 *  - Mobile (Android/iOS): touch swipe up → next 2, swipe down → prev 2.
 *  - Tombol Sebelumnya/Berikutnya untuk manual control.
 *  - Cooldown 500ms supaya 1 gesture = 1 slide (tidak rapid-fire).
 *  - Indicator: "Artikel 1-2 dari N" + progress bar.
 *  - End state: tombol Berikutnya disabled, "✓ Sampai artikel terakhir".
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
  articles: ArticleItem[]
}

const VISIBLE_COUNT = 2
const CARD_HEIGHT = 132 // px — tinggi per card (sesuai measure production)
const CARD_GAP = 16 // px — space-y-4 = 1rem = 16px
const SLIDE_DISTANCE = CARD_HEIGHT + CARD_GAP // 148px per slide step

function ArticleCard({ a }: { a: ArticleItem }) {
  const href = `/berita/${a.category.slug}/${a.slug}`
  const badge = categoryBadgeClass(a.category.color)
  const alt = a.featuredImageAlt || a.title
  const hasImage = Boolean(a.featuredImageUrl)
  const publishedDate = a.publishedAt instanceof Date ? a.publishedAt : (a.publishedAt ? new Date(a.publishedAt) : null)
  const dateLabel = formatTanggalPendek(publishedDate) || '—'

  return (
    <li
      className="rounded-xl border border-border bg-card p-3 sm:p-4 transition-all duration-200 hover:shadow-md hover:border-brand/40"
      style={{ height: `${CARD_HEIGHT}px` }}
    >
      <Link href={href} className="group flex gap-3 sm:gap-4 items-start h-full">
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

export function ArticlesList({ articles }: ArticlesListProps) {
  const [startIndex, setStartIndex] = useState(0) // index artikel pertama yang visible

  const total = articles.length
  const maxStartIndex = Math.max(0, total - VISIBLE_COUNT)

  const canNext = startIndex < maxStartIndex
  const canPrev = startIndex > 0

  const nextBatch = useCallback(() => {
    setStartIndex((prev) => {
      const next = prev + VISIBLE_COUNT
      return next > maxStartIndex ? prev : next
    })
  }, [maxStartIndex])

  const prevBatch = useCallback(() => {
    setStartIndex((prev) => {
      const next = prev - VISIBLE_COUNT
      return next < 0 ? 0 : next
    })
  }, [])

  // Auto-advance via wheel (desktop) + touch (Android/iOS) dengan throttle 500ms.
  // PRINSIP: scroll/swipe = SLIDE ke 2 card berikutnya (CSS transform),
  // BUKAN reload/fetch API. Pure animation, instant.
  useEffect(() => {
    const section = document.getElementById('artikel')
    if (!section) return

    let lastTrigger = 0
    const COOLDOWN = 500 // ms — minimal jarak antar slide
    const TOUCH_THRESHOLD = 50 // px — minimal swipe distance

    const isSectionVisible = () => {
      const rect = section.getBoundingClientRect()
      return rect.top < window.innerHeight * 0.5 && rect.bottom > window.innerHeight * 0.5
    }

    const tryAdvance = (direction: 'next' | 'prev') => {
      const now = Date.now()
      if (now - lastTrigger < COOLDOWN) return
      if (!isSectionVisible()) return
      lastTrigger = now
      if (direction === 'next') nextBatch()
      else prevBatch()
    }

    // Desktop: mouse wheel
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) tryAdvance('next')
      else if (e.deltaY < 0) tryAdvance('prev')
    }

    // Mobile (Android/iOS): touch swipe
    let touchStartY = 0
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0
    }
    const onTouchEnd = (e: TouchEvent) => {
      const endY = e.changedTouches[0]?.clientY ?? 0
      const deltaY = touchStartY - endY // positive = swipe up = scroll down
      if (Math.abs(deltaY) < TOUCH_THRESHOLD) return // too small, ignore
      if (deltaY > 0) tryAdvance('next') // swipe up → next batch
      else tryAdvance('prev') // swipe down → prev batch
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [nextBatch, prevBatch])

  if (articles.length === 0) {
    return (
      <div className="mt-10 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Belum ada artikel.
      </div>
    )
  }

  // Current visible range untuk indicator
  const visibleEnd = Math.min(startIndex + VISIBLE_COUNT, total)
  const isLastBatch = !canNext

  return (
    <>
      {/* Carousel container — overflow:hidden, fixed height untuk 2 card.
          Inner track di-translate dengan CSS transform (NO reload). */}
      <div
        className="mt-6 overflow-hidden"
        style={{ height: `${VISIBLE_COUNT * CARD_HEIGHT + (VISIBLE_COUNT - 1) * CARD_GAP}px` }}
      >
        <ul
          className="space-y-4 transition-transform duration-500 ease-out"
          style={{ transform: `translateY(-${startIndex * SLIDE_DISTANCE}px)` }}
        >
          {articles.map((a) => (
            <ArticleCard key={a.id} a={a} />
          ))}
        </ul>
      </div>

      {/* Navigation indicator + tombol prev/next — SETELAH carousel. */}
      <div className="mt-6 flex items-center justify-between gap-4">
        {/* Tombol Sebelumnya */}
        <button
          type="button"
          onClick={prevBatch}
          disabled={!canPrev}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <ChevronLeft className="size-3.5" />
          Sebelumnya
        </button>

        {/* Indicator: "Artikel 1-2 dari N" + progress bar */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Artikel {startIndex + 1}-{visibleEnd} dari {total}
          </span>
          {/* Progress bar */}
          <div className="h-1 w-32 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-brand transition-all duration-300"
              style={{ width: `${(visibleEnd / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Tombol Berikutnya */}
        <button
          type="button"
          onClick={nextBatch}
          disabled={!canNext}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          Berikutnya
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      {/* End state — sudah sampai artikel terakhir */}
      {isLastBatch && (
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-emerald-500" />
          Sampai artikel terakhir
        </div>
      )}
    </>
  )
}
