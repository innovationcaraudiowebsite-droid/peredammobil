import Link from 'next/link'
import { Plus } from 'lucide-react'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ArticlesTable, type ArticleListItem } from '@/components/admin/articles/articles-table'
import { Button } from '@/components/ui/button'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'Daftar Artikel — Admin Peredam Mobil Jakarta',
  description: 'Kelola semua artikel portal media.',
  robots: { index: false, follow: false },
}

const PAGE_SIZE = 10

interface SearchParams {
  q?: string
  category?: string
  status?: string
  sort?: string
  page?: string
}

export default async function ArticlesListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()

  const sp = await searchParams
  const q = (sp.q ?? '').trim()
  const categoryFilter = (sp.category ?? 'all').toLowerCase()
  const statusFilter = (sp.status ?? 'all').toUpperCase()
  const sort = sp.sort ?? 'newest'
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)

  // Build where
  const where: { [k: string]: unknown } = {}
  if (q) where.title = { contains: q }
  if (statusFilter !== 'ALL' && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(statusFilter)) {
    where.status = statusFilter
  }
  if (categoryFilter !== 'all') {
    where.category = { slug: categoryFilter }
  }

  // Build orderBy
  let orderBy: { [k: string]: 'asc' | 'desc' } = { createdAt: 'desc' }
  switch (sort) {
    case 'oldest':
      orderBy = { createdAt: 'asc' }
      break
    case 'popular':
      orderBy = { viewCount: 'desc' }
      break
    case 'title-asc':
      orderBy = { title: 'asc' }
      break
    case 'newest':
    default:
      orderBy = { createdAt: 'desc' }
  }

  // Wrap in try/catch to prevent 500 crash if DB query fails
  let total = 0
  let items: any[] = []
  let categories: any[] = []
  
  try {
    ;([
      total,
      items,
      categories,
    ] = await Promise.all([
      db.article.count({ where }),
      db.article.findMany({
        where,
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          category: {
            select: { id: true, name: true, slug: true, color: true },
          },
        },
      }),
      db.category.findMany({
        orderBy: { order: 'asc' },
        select: { id: true, name: true, slug: true, color: true },
      }),
    ] as any[]))
  } catch (err) {
    console.error('[admin/articles] DB query failed:', err)
  }

  const rows: ArticleListItem[] = (items || []).map((a: any) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    status: a.status,
    viewCount: a.viewCount,
    authorName: a.authorName,
    publishedAt: a.publishedAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    isFeatured: a.isFeatured,
    isBreaking: a.isBreaking,
    category: {
      id: a.category.id,
      name: a.category.name,
      slug: a.category.slug,
      color: a.category.color,
    },
  }))

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Daftar Artikel
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola, sunting, dan publikasikan artikel portal Peredam Mobil Jakarta.
          </p>
        </div>
        <Button
          asChild
          className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 sm:hidden"
        >
          <Link href="/admin/articles/new">
            <Plus className="h-4 w-4" />
            Artikel Baru
          </Link>
        </Button>
      </div>

      <ArticlesTable
        items={rows}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        q={q}
        categoryFilter={categoryFilter}
        statusFilter={statusFilter === 'ALL' ? 'all' : statusFilter.toLowerCase()}
        sort={sort}
        categories={categories}
      />

      {/* Mount Sonner toaster for this page */}
      <SonnerToaster richColors position="top-right" />
    </div>
  )
}
