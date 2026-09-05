import { CalendarDays, Sparkles } from 'lucide-react'
import { formatTanggalPanjang } from '@/lib/format-tanggal'

/**
 * Breaking ticker — tanggal hari ini + tagline portal.
 * Server component (no interactivity needed).
 */
export function BreakingTicker({
  tagline,
  headlines,
}: {
  tagline: string
  /** Headlines (article titles) untuk marquee — ambil dari artikel PUBLISHED terbaru */
  headlines?: string[]
}) {
  const today = new Date()
  const dateLabel = formatTanggalPanjang(today)

  return (
    <div className="border-b border-border bg-amber-500 text-amber-950 dark:bg-amber-600 dark:text-amber-50">
      <div className="container mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-xs sm:text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide shrink-0">
          <Sparkles className="size-3.5" aria-hidden />
          Berita Terbaru
        </span>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-amber-900/80 dark:text-amber-100/80 shrink-0">
          <CalendarDays className="size-3.5" aria-hidden />
          {dateLabel}
        </span>
        {headlines && headlines.length > 0 ? (
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex gap-8 whitespace-nowrap animate-marquee">
              {[...headlines, ...headlines].map((h, i) => (
                <span
                  key={i}
                  className="text-amber-950/90 dark:text-amber-50/90"
                  title={h}
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <span className="truncate text-amber-950/90 dark:text-amber-50/90">
            {tagline}
          </span>
        )}
      </div>
    </div>
  )
}
