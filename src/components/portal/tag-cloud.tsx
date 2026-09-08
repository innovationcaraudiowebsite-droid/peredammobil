import Link from 'next/link'
import { Hash } from 'lucide-react'
import type { PortalTag } from '@/lib/portal'

/**
 * Tag cloud "Topik Populer" — link ke halaman pencarian (?q=tagName).
 * Font-size based on articleCount (relative scale).
 *
 * Server component.
 */
export function TagCloud({ tags }: { tags: PortalTag[] }) {
  if (!tags || tags.length === 0) return null

  const max = Math.max(...tags.map((t) => t.articleCount), 1)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-amber-500/10 to-transparent">
        <h3 className="inline-flex items-center gap-2 font-bold text-base">
          <Hash className="size-5 text-amber-500" aria-hidden />
          Topik Populer
        </h3>
      </div>
      <div className="p-4 flex flex-wrap gap-2">
        {tags.map((t) => {
          // Skala ukuran berdasarkan count: count==max → xl, count==1 → sm
          const ratio = t.articleCount / max
          const sizeClass =
            ratio > 0.75
              ? 'text-base font-semibold px-3 py-1.5'
              : ratio > 0.5
                ? 'text-sm font-medium px-2.5 py-1.5'
                : ratio > 0.25
                  ? 'text-sm font-normal px-2.5 py-1'
                  : 'text-xs font-normal px-2 py-0.5'
          return (
            <Link
              key={t.id}
              href={`/pencarian?q=${encodeURIComponent(t.name)}`}
              className={`rounded-full border border-border bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors ${sizeClass}`}
              title={`${t.articleCount} artikel tentang ${t.name}`}
            >
              #{t.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
