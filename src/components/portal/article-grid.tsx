import type { PortalArticleListItem } from '@/lib/portal'
import { ArticleCard } from './article-card'

/**
 * Grid wrapper untuk list artikel.
 *
 * Layout: 1 col (mobile), 2 col (sm), 3 col (lg), 4 col (xl) bila `cols=4`,
 * atau 3 col (lg) bila `cols=3`.
 */
export function ArticleGrid({
  articles,
  cols = 3,
  priorityFirst = false,
}: {
  articles: PortalArticleListItem[]
  cols?: 2 | 3 | 4
  priorityFirst?: boolean
}) {
  if (!articles || articles.length === 0) return null
  const lgColsClass =
    cols === 4 ? 'lg:grid-cols-4' : cols === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${lgColsClass}`}>
      {articles.map((a, i) => (
        <ArticleCard key={a.id} article={a} priority={priorityFirst && i === 0} />
      ))}
    </div>
  )
}
