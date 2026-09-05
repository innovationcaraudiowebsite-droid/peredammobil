'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

/**
 * Mapping segment URL → label Indonesia untuk breadcrumb.
 * Untuk ID dynamic (mis. /admin/articles/abc123) kita tampilkan "Detail".
 */
const segmentLabels: Record<string, string | ((segment: string) => string)> = {
  admin: 'Dashboard',
  articles: 'Artikel',
  new: 'Tambah Baru',
  categories: 'Kategori',
  tags: 'Tag',
  faq: 'FAQ',
  comments: 'Komentar',
  subscribers: 'Subscriber',
  settings: 'Pengaturan',
  edit: 'Edit',
}

function labelForSegment(segment: string, index: number, total: number): string {
  const mapper = segmentLabels[segment]
  if (typeof mapper === 'function') return mapper(segment)
  if (typeof mapper === 'string') return mapper
  // Looks like a CUID (dynamic id). Show "Detail" except for the last "edit" case.
  if (segment.length >= 20) return 'Detail'
  // Fallback: capitalize
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}

export function AdminBreadcrumb() {
  const pathname = usePathname() || '/admin'
  // strip query string & trailing slash
  const clean = pathname.split('?')[0].replace(/\/$/, '')
  const segments = clean.split('/').filter(Boolean)

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1
          const href = '/' + segments.slice(0, i + 1).join('/')
          const label = labelForSegment(seg, i, segments.length)
          return (
            <li key={href} className="inline-flex min-w-0 items-center gap-1">
              {i > 0 && (
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50"
                  aria-hidden
                />
              )}
              {isLast ? (
                <span className="truncate font-medium text-foreground">{label}</span>
              ) : (
                <Link
                  href={href}
                  className="truncate transition-colors hover:text-foreground"
                >
                  {label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
