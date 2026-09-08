import Link from 'next/link'
import { CalendarDays, Clock, Eye } from 'lucide-react'
import { formatTanggalPendek, formatNumber, relativeTime } from '@/lib/format-tanggal'
import type { PortalArticleListItem } from '@/lib/portal'
import { categoryBadgeClass } from '@/lib/portal'

/**
 * Reusable article card untuk listing/grid.
 *
 * Variant:
 *  - 'default'   : vertical card (image 16:9 di atas, content di bawah)
 *  - 'horizontal' : horizontal layout untuk sidebar
 *  - 'compact'    : image kecil + title (untuk popular sidebar)
 *  - 'overlay'    : image dengan overlay teks (untuk hero big)
 */
type Variant = 'default' | 'horizontal' | 'compact' | 'overlay'

export function ArticleCard({
  article,
  variant = 'default',
  priority = false,
}: {
  article: PortalArticleListItem
  variant?: Variant
  priority?: boolean
}) {
  const href = `/berita/${article.category.slug}/${article.slug}`
  const categoryColor = categoryBadgeClass(article.category.color)
  const dateLabel =
    relativeTime(article.publishedAt) || formatTanggalPendek(article.publishedAt)
  const imageAlt = article.featuredImageAlt || article.title
  const hasImage = Boolean(article.featuredImageUrl)

  if (variant === 'compact') {
    return (
      <Link href={href} className="group block">
        <article className="flex gap-3 items-start">
          <div className="shrink-0 size-16 overflow-hidden rounded-md bg-muted relative">
            {hasImage ? (
              <img
                src={article.featuredImageUrl!}
                alt={imageAlt}
                className="absolute inset-0 size-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-muted-foreground/40">
                <span className="text-xs font-semibold">PMJ</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h4>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3" />
                {formatNumber(article.viewCount)}
              </span>
              <span>{dateLabel}</span>
            </div>
          </div>
        </article>
      </Link>
    )
  }

  if (variant === 'horizontal') {
    return (
      <Link href={href} className="group block">
        <article className="flex gap-4 items-start">
          <div className="shrink-0 w-32 sm:w-40 aspect-[16/10] overflow-hidden rounded-lg bg-muted relative">
            {hasImage ? (
              <img
                src={article.featuredImageUrl!}
                alt={imageAlt}
                className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-muted-foreground/30 text-xs">
                Tanpa Gambar
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span
              className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${categoryColor}`}
            >
              {article.category.name}
            </span>
            <h3 className="mt-1.5 font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3" />
                {dateLabel}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" />
                {article.readingTimeMinutes} mnt
              </span>
            </div>
          </div>
        </article>
      </Link>
    )
  }

  if (variant === 'overlay') {
    return (
      <Link
        href={href}
        className="group relative block overflow-hidden rounded-xl aspect-[16/10] sm:aspect-[16/9]"
      >
        {hasImage ? (
          <img
            src={article.featuredImageUrl!}
            alt={imageAlt}
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading={priority ? 'eager' : 'lazy'}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-slate-800/50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 text-white">
          <span
            className={`inline-block rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${categoryColor}`}
          >
            {article.category.name}
          </span>
          <h3 className="mt-2 text-lg sm:text-xl lg:text-2xl font-bold leading-tight line-clamp-3 group-hover:text-amber-300 transition-colors">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="mt-1.5 text-sm text-white/85 line-clamp-2 hidden sm:block">
              {article.excerpt}
            </p>
          )}
          <div className="mt-2.5 flex items-center gap-3 text-xs text-white/75">
            <span>{article.authorName}</span>
            <span aria-hidden>·</span>
            <span>{dateLabel}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {article.readingTimeMinutes} mnt
            </span>
          </div>
        </div>
      </Link>
    )
  }

  // default — vertical card
  return (
    <Link href={href} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-200 hover:shadow-md hover:border-primary/40">
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {hasImage ? (
            <img
              src={article.featuredImageUrl!}
              alt={imageAlt}
              className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading={priority ? 'eager' : 'lazy'}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-slate-800">
              <span className="text-amber-700 dark:text-amber-300 text-xs font-semibold uppercase tracking-wider">
                Peredam Mobil Jakarta
              </span>
            </div>
          )}
          <span
            className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm ${categoryColor}`}
          >
            {article.category.name}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="mt-1.5 text-sm text-muted-foreground line-clamp-3">
              {article.excerpt}
            </p>
          )}
          <div className="mt-auto pt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3" />
              {dateLabel}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {article.readingTimeMinutes} mnt
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="size-3" />
              {formatNumber(article.viewCount)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

