import Link from 'next/link'
import { ArrowRight, Clock, Eye } from 'lucide-react'
import type { PortalArticleListItem } from '@/lib/portal'
import { categoryBadgeClass } from '@/lib/portal'
import { formatNumber, formatTanggalPendek, relativeTime } from '@/lib/format-tanggal'
import { ArticleCard } from './article-card'

/**
 * Hero featured — 1 big (kiri, 2/3) + 2 small (kanan, 1/3 stacked).
 *
 * Big pakai variant='overlay', small pakai card default dengan ratio lebih compact.
 */
export function HeroFeatured({
  main,
  secondary,
}: {
  main: PortalArticleListItem
  secondary: PortalArticleListItem[]
}) {
  const mainHref = `/berita/${main.category.slug}/${main.slug}`
  const mainColor = categoryBadgeClass(main.category.color)
  const mainDate =
    relativeTime(main.publishedAt) || formatTanggalPendek(main.publishedAt)

  return (
    <section className="py-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* BIG featured */}
        <Link
          href={mainHref}
          className="group relative lg:col-span-2 block overflow-hidden rounded-xl aspect-[16/9] sm:aspect-[16/9]"
        >
          {main.featuredImageUrl ? (
            <img
              src={main.featuredImageUrl}
              alt={main.featuredImageAlt || main.title}
              className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="eager"
              fetchPriority="high"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-amber-600 to-slate-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 lg:p-8 text-white">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide shadow-sm ${mainColor}`}
              >
                Berita Utama · {main.category.name}
              </span>
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight line-clamp-3 group-hover:text-amber-300 transition-colors max-w-3xl">
              {main.title}
            </h1>
            {main.excerpt && (
              <p className="mt-2 text-sm sm:text-base text-white/85 line-clamp-2 max-w-2xl hidden sm:block">
                {main.excerpt}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-white/80">
              <span className="font-medium">{main.authorName}</span>
              <span aria-hidden>·</span>
              <span>{mainDate}</span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                {main.readingTimeMinutes} menit
              </span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3.5" />
                {formatNumber(main.viewCount)} dibaca
              </span>
            </div>
          </div>
        </Link>

        {/* Secondary cards — stacked */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-1">
          {secondary.slice(0, 2).map((a) => (
            <ArticleCard key={a.id} article={a} variant="overlay" />
          ))}
          {secondary.length === 0 && (
            <div className="hidden lg:flex items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground p-6">
              Belum ada artikel pilihan lain.
            </div>
          )}
        </div>
      </div>

      {/* Quick link ke arsip */}
      <div className="mt-4 flex justify-end">
        <Link
          href="/pencarian?q=peredam"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Lihat semua artikel
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  )
}
