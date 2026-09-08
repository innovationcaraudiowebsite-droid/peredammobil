import Link from 'next/link'
import { ChevronRight, Home as HomeIcon } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb'
import { BreadcrumbListSchema, JsonLd, type BreadcrumbItem } from '@/components/seo/json-ld'

/**
 * Reusable portal breadcrumb with schema.org BreadcrumbList JSON-LD inline.
 *
 * - Renders the visual breadcrumb using shadcn/ui Breadcrumb primitives.
 * - Collapses long lists with ellipsis on mobile.
 * - Injects BreadcrumbListSchema JSON-LD for SEO.
 *
 * Usage:
 *   <PortalBreadcrumb
 *     items={[
 *       { name: 'Beranda', url: '/' },
 *       { name: 'Peredam Mobil', url: '/kategori/peredam-mobil' },
 *       { name: 'Article Title' },  // current page (no url)
 *     ]}
 *   />
 */
export function PortalBreadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[]
  className?: string
}) {
  if (!items.length) return null

  // Build schema list — same as visual items.
  const schemaItems = items.map((it) => ({
    name: it.name,
    url: it.url,
  }))

  // For mobile collapse: show first + ellipsis + last 2 items if more than 4.
  const visibleItems =
    items.length > 4 ? [items[0], items[items.length - 2], items[items.length - 1]] : items
  const hasEllipsis = items.length > 4

  return (
    <>
      <Breadcrumb className={className}>
        <BreadcrumbList>
          {visibleItems.map((item, idx) => {
            const isLast = idx === visibleItems.length - 1
            const isFirst = idx === 0
            // Insert ellipsis between first and last-2 if we collapsed.
            return (
              <div key={idx} className="contents">
                {hasEllipsis && idx === 1 && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem className="hidden sm:list-item">
                      <BreadcrumbEllipsis />
                    </BreadcrumbItem>
                  </>
                )}
                <BreadcrumbItem>
                  {isFirst && (
                    <HomeIcon className="size-3.5 text-muted-foreground" aria-hidden />
                  )}
                  {isLast ? (
                    <BreadcrumbPage className="line-clamp-1 max-w-[60vw] sm:max-w-md">
                      {item.name}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={item.url || '#'}>{item.name}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </div>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Schema.org BreadcrumbList JSON-LD — always full list (not collapsed). */}
      <JsonLd schema={BreadcrumbListSchema(schemaItems)} />
    </>
  )
}

/** Compact helper — render just Beranda › current. */
export function HomeBreadcrumb(currentName: string, className?: string) {
  return (
    <PortalBreadcrumb
      className={className}
      items={[
        { name: 'Beranda', url: '/' },
        { name: currentName },
      ]}
    />
  )
}

/** Beranda › Category (link) › Current (article). */
export function ArticleBreadcrumb(opts: {
  categoryName: string
  categorySlug: string
  title: string
  className?: string
}) {
  return (
    <PortalBreadcrumb
      className={opts.className}
      items={[
        { name: 'Beranda', url: '/' },
        { name: opts.categoryName, url: `/kategori/${opts.categorySlug}` },
        { name: opts.title },
      ]}
    />
  )
}
