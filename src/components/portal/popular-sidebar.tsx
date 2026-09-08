import { Eye, Flame } from 'lucide-react'
import type { PortalArticleListItem } from '@/lib/portal'
import { formatNumber, formatTanggalPendek, relativeTime } from '@/lib/format-tanggal'
import Link from 'next/link'

/**
 * Sidebar "Paling Banyak Dibaca" — ranked list 1..N dengan view count.
 *
 * Server component. Angka ranking tampil di kiri dengan size besar + warna amber gradient
 * untuk top 3, slate untuk sisanya.
 */
export function PopularSidebar({
  articles,
  title = 'Paling Banyak Dibaca',
  take = 6,
}: {
  articles: PortalArticleListItem[]
  title?: string
  take?: number
}) {
  const list = articles.slice(0, take)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-amber-500/10 to-transparent">
        <h3 className="inline-flex items-center gap-2 font-bold text-base">
          <Flame className="size-5 text-amber-500" aria-hidden />
          {title}
        </h3>
      </div>
      <ol className="divide-y divide-border">
        {list.map((a, i) => {
          const rank = i + 1
          const isTop3 = rank <= 3
          const href = `/berita/${a.category.slug}/${a.slug}`
          const dateLabel =
            relativeTime(a.publishedAt) || formatTanggalPendek(a.publishedAt)
          return (
            <li key={a.id}>
              <Link
                href={href}
                className="group flex gap-3 items-start px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <span
                  className={`shrink-0 text-2xl font-bold tabular-nums leading-none w-8 text-center pt-1 ${
                    isTop3
                      ? 'text-amber-500 dark:text-amber-400'
                      : 'text-muted-foreground'
                  }`}
                  aria-hidden
                >
                  {rank}
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {a.title}
                  </h4>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="size-3" />
                      {formatNumber(a.viewCount)}
                    </span>
                    <span>{dateLabel}</span>
                  </div>
                </div>
              </Link>
            </li>
          )
        })}
        {list.length === 0 && (
          <li className="px-4 py-6 text-sm text-muted-foreground text-center">
            Belum ada data.
          </li>
        )}
      </ol>
    </div>
  )
}
