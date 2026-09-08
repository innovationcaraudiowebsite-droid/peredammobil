import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { PortalArticleListItem, PortalCategory } from '@/lib/portal'
import { categoryBadgeClass, categoryDotClass } from '@/lib/portal'
import { ArticleCard } from './article-card'

/**
 * Section per kategori — header (nama + deskripsi + link "Lihat semua") + grid 3-4 cards.
 */
export function CategorySection({
  category,
  articles,
  showDescription = true,
}: {
  category: PortalCategory
  articles: PortalArticleListItem[]
  showDescription?: boolean
}) {
  if (!articles || articles.length === 0) return null
  const badgeClass = categoryBadgeClass(category.color)
  const dotClass = categoryDotClass(category.color)
  return (
    <section className="py-6 border-t border-border">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5">
        <div className="flex items-start gap-3">
          <span className={`mt-1.5 size-2.5 rounded-full shrink-0 ${dotClass}`} aria-hidden />
          <div>
            <Link
              href={`/kategori/${category.slug}`}
              className="group inline-flex items-center gap-2"
            >
              <span
                className={`rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${badgeClass}`}
              >
                {category.name}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">
                {category.name}
              </h2>
            </Link>
            {showDescription && category.description && (
              <p className="mt-1 text-sm text-muted-foreground max-w-2xl line-clamp-2">
                {category.description}
              </p>
            )}
          </div>
        </div>
        <Link
          href={`/kategori/${category.slug}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0"
        >
          Lihat semua
          <ArrowRight className="size-4" />
        </Link>
      </div>

      {/* Articles grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {articles.map((a, i) => (
          <ArticleCard key={a.id} article={a} priority={false} />
        ))}
      </div>
    </section>
  )
}
