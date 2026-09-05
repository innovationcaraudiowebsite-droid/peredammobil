import 'server-only'
import { db } from '@/lib/db'
import type { SiteSetting } from '@prisma/client'

/**
 * Server-only helpers untuk fetching SiteSetting & data homepage portal.
 *
 * Dipakai di:
 *  - app/layout.tsx       → metadata
 *  - app/page.tsx         → homepage
 *  - app/berita/...        → artikel detail
 *  - app/kategori/...      → listing per kategori
 *  - app/pencarian/...      → search result
 *
 * Pattern singleton SiteSetting: upsert dengan where:{id:"global"} update:{} create:{}
 * → auto-create default jika belum ada (idempotent).
 */
export async function getSiteSetting(): Promise<SiteSetting> {
  return db.siteSetting.upsert({
    where: { id: 'global' },
    update: {},
    create: {},
  })
}

/* -------------------------------------------------------------------------- */
/*  Types untuk portal components                                             */
/* -------------------------------------------------------------------------- */

export type PortalCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
}

export type PortalTag = {
  id: string
  name: string
  slug: string
  articleCount: number
}

export type PortalArticleListItem = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  featuredImageUrl: string | null
  featuredImageAlt: string | null
  authorName: string
  readingTimeMinutes: number
  viewCount: number
  publishedAt: Date | null
  category: PortalCategory
  tags: { id: string; name: string; slug: string }[]
}

export type PortalArticleDetail = PortalArticleListItem & {
  content: string
  contentMarkdown: string | null
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string | null
  ogImageUrl: string | null
  wordCount: number
  isFeatured: boolean
  isBreaking: boolean
  shareCount: number
  createdAt: Date
  updatedAt: Date
}

export type PortalFaq = {
  id: string
  question: string
  answer: string
  order: number
}

/* -------------------------------------------------------------------------- */
/*  Query helpers                                                              */
/* -------------------------------------------------------------------------- */

const PUBLISHED_WHERE = { status: 'PUBLISHED' } as const

const articleListSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  featuredImageUrl: true,
  featuredImageAlt: true,
  authorName: true,
  readingTimeMinutes: true,
  viewCount: true,
  publishedAt: true,
  isFeatured: true,
  isBreaking: true,
  category: {
    select: { id: true, name: true, slug: true, description: true, color: true },
  },
  tags: { select: { id: true, name: true, slug: true } },
} as const

/**
 * Konversi string warna kategori (DB) ke class Tailwind untuk badge.
 * Fallback: amber.
 */
export function categoryBadgeClass(color: string | null | undefined): string {
  switch (color) {
    case 'amber':
      return 'bg-amber-500 text-white'
    case 'red':
      return 'bg-rose-500 text-white'
    case 'emerald':
      return 'bg-emerald-500 text-white'
    case 'slate':
      return 'bg-slate-600 text-white'
    case 'violet':
      return 'bg-violet-500 text-white'
    case 'rose':
      return 'bg-rose-500 text-white'
    case 'cyan':
      return 'bg-cyan-500 text-white'
    case 'zinc':
      return 'bg-zinc-600 text-white'
    default:
      return 'bg-amber-500 text-white'
  }
}

/**
 * Konversi string warna kategori ke kelas dot kecil (untuk UI mini).
 */
export function categoryDotClass(color: string | null | undefined): string {
  switch (color) {
    case 'amber':
      return 'bg-amber-500'
    case 'red':
      return 'bg-rose-500'
    case 'emerald':
      return 'bg-emerald-500'
    case 'slate':
      return 'bg-slate-500'
    case 'violet':
      return 'bg-violet-500'
    case 'rose':
      return 'bg-rose-500'
    case 'cyan':
      return 'bg-cyan-500'
    case 'zinc':
      return 'bg-zinc-500'
    default:
      return 'bg-amber-500'
  }
}

/**
 * Fetch featured articles (isFeatured=true, PUBLISHED).
 * Jika kurang dari `minCount`, isi sisa dengan artikel populer (sort by viewCount).
 */
export async function getFeaturedArticles(
  minCount = 3,
): Promise<PortalArticleListItem[]> {
  const featured = await db.article.findMany({
    where: { ...PUBLISHED_WHERE, isFeatured: true },
    orderBy: [{ publishedAt: 'desc' }],
    take: minCount,
    select: articleListSelect,
  })
  if (featured.length >= minCount) return featured as PortalArticleListItem[]
  // Tambahan: ambil populer yg bukan featured
  const need = minCount - featured.length
  const excludeIds = featured.map((a) => a.id)
  const popular = await db.article.findMany({
    where: { ...PUBLISHED_WHERE, id: { notIn: excludeIds } },
    orderBy: [{ viewCount: 'desc' }, { publishedAt: 'desc' }],
    take: need,
    select: articleListSelect,
  })
  return [...featured, ...popular] as PortalArticleListItem[]
}

/**
 * Latest articles (default 4) — PUBLISHED, sort by publishedAt desc, exclude ids.
 */
export async function getLatestArticles(
  take = 4,
  excludeIds: string[] = [],
): Promise<PortalArticleListItem[]> {
  return (await db.article.findMany({
    where: { ...PUBLISHED_WHERE, id: { notIn: excludeIds } },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take,
    select: articleListSelect,
  })) as PortalArticleListItem[]
}

/**
 * Articles per category — top N per kategori (PUBLISHED), sort by publishedAt desc.
 * Return: array of { category, articles[] }
 */
export async function getArticlesPerCategory(
  perCategory = 4,
  excludeIds: string[] = [],
): Promise<{ category: PortalCategory; articles: PortalArticleListItem[] }[]> {
  const categories = await db.category.findMany({
    orderBy: { order: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      color: true,
    },
  })
  const result: { category: PortalCategory; articles: PortalArticleListItem[] }[] =
    []
  for (const c of categories) {
    const articles = await db.article.findMany({
      where: {
        ...PUBLISHED_WHERE,
        categoryId: c.id,
        id: { notIn: excludeIds },
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: perCategory,
      select: articleListSelect,
    })
    if (articles.length > 0) {
      result.push({ category: c as PortalCategory, articles: articles as PortalArticleListItem[] })
    }
  }
  return result
}

/**
 * Paling banyak dibaca — top N by viewCount (PUBLISHED).
 */
export async function getMostReadArticles(
  take = 6,
): Promise<PortalArticleListItem[]> {
  return (await db.article.findMany({
    where: PUBLISHED_WHERE,
    orderBy: [{ viewCount: 'desc' }, { publishedAt: 'desc' }],
    take,
    select: articleListSelect,
  })) as PortalArticleListItem[]
}

/**
 * Topik populer — top N tags by article count (only tags w/ articles).
 */
export async function getPopularTags(
  take = 12,
): Promise<PortalTag[]> {
  // Ambil semua tag, lalu hitung article count per tag di aplikasi (simple & reliable di SQLite).
  const tags = await db.tag.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      articles: { select: { id: true } },
    },
  })
  return tags
    .map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      articleCount: t.articles.length,
    }))
    .filter((t) => t.articleCount > 0)
    .sort((a, b) => b.articleCount - a.articleCount)
    .slice(0, take)
}

/**
 * FAQ list (published only, sort by order asc).
 */
export async function getPublishedFaqs(): Promise<PortalFaq[]> {
  return db.faq.findMany({
    where: { isPublished: true },
    orderBy: { order: 'asc' },
    select: { id: true, question: true, answer: true, order: true },
  })
}

/* -------------------------------------------------------------------------- */
/*  Article detail + related + category list helpers                           */
/* -------------------------------------------------------------------------- */

export async function getArticleBySlug(
  slug: string,
): Promise<PortalArticleDetail | null> {
  const a = await db.article.findFirst({
    where: { slug, status: 'PUBLISHED' },
    select: {
      ...articleListSelect,
      content: true,
      contentMarkdown: true,
      metaTitle: true,
      metaDescription: true,
      metaKeywords: true,
      ogImageUrl: true,
      wordCount: true,
      shareCount: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  return a as unknown as PortalArticleDetail | null
}

export async function getArticleByCategoryAndSlug(
  categorySlug: string,
  articleSlug: string,
): Promise<PortalArticleDetail | null> {
  const category = await db.category.findUnique({
    where: { slug: categorySlug },
    select: { id: true },
  })
  if (!category) return null
  const a = await db.article.findFirst({
    where: { slug: articleSlug, categoryId: category.id, status: 'PUBLISHED' },
    select: {
      ...articleListSelect,
      content: true,
      contentMarkdown: true,
      metaTitle: true,
      metaDescription: true,
      metaKeywords: true,
      ogImageUrl: true,
      wordCount: true,
      shareCount: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  return a as unknown as PortalArticleDetail | null
}

/**
 * Related articles — same category, exclude self, top N.
 */
export async function getRelatedArticles(
  articleId: string,
  categoryId: string,
  take = 3,
): Promise<PortalArticleListItem[]> {
  return (await db.article.findMany({
    where: {
      ...PUBLISHED_WHERE,
      categoryId,
      id: { not: articleId },
    },
    orderBy: [{ publishedAt: 'desc' }],
    take,
    select: articleListSelect,
  })) as PortalArticleListItem[]
}

/**
 * Increment viewCount — fire & forget.
 */
export async function incrementArticleView(slug: string): Promise<void> {
  await db.article.updateMany({
    where: { slug, status: 'PUBLISHED' },
    data: { viewCount: { increment: 1 } },
  })
}

/**
 * Search articles (used by /api/search & /pencarian page).
 */
export async function searchArticles(
  query: string,
  take = 12,
  skip = 0,
): Promise<{ items: PortalArticleListItem[]; total: number }> {
  const q = query.trim()
  if (!q) return { items: [], total: 0 }
  // SQLite LIKE case-insensitive secara default.
  const where = {
    status: 'PUBLISHED' as const,
    OR: [
      { title: { contains: q } },
      { excerpt: { contains: q } },
      { contentMarkdown: { contains: q } },
      { authorName: { contains: q } },
    ],
  }
  const [items, total] = await Promise.all([
    db.article.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { viewCount: 'desc' }],
      take,
      skip,
      select: articleListSelect,
    }),
    db.article.count({ where }),
  ])
  return {
    items: items as PortalArticleListItem[],
    total,
  }
}

/**
 * Get articles by category (for /kategori/[slug] listing).
 * Pagination via skip/take.
 */
export async function getArticlesByCategory(
  categorySlug: string,
  take = 9,
  skip = 0,
): Promise<{
  category: PortalCategory | null
  items: PortalArticleListItem[]
  total: number
}> {
  const category = await db.category.findUnique({
    where: { slug: categorySlug },
    select: { id: true, name: true, slug: true, description: true, color: true },
  })
  if (!category) return { category: null, items: [], total: 0 }
  const [items, total] = await Promise.all([
    db.article.findMany({
      where: { ...PUBLISHED_WHERE, categoryId: category.id },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take,
      skip,
      select: articleListSelect,
    }),
    db.article.count({ where: { ...PUBLISHED_WHERE, categoryId: category.id } }),
  ])
  return {
    category: category as PortalCategory,
    items: items as PortalArticleListItem[],
    total,
  }
}

/**
 * Approved comments untuk artikel (public, untuk halaman detail).
 */
export async function getApprovedComments(articleId: string) {
  return db.comment.findMany({
    where: { articleId, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      authorName: true,
      content: true,
      createdAt: true,
    },
  })
}
