import 'server-only'
import { db } from '@/lib/db'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import type { SiteSetting } from '@/lib/types'

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
 * IMPORTANT — error handling:
 *   Every DB-querying function wraps its query in try/catch and returns a
 *   safe fallback (empty array / null / default object). This way, if the
 *   database is unreachable from Vercel serverless (e.g. wrong DATABASE_URL,
 *   pool exhausted, network issue), pages still render with empty content
 *   instead of throwing "server-side exception".
 *
 *   Errors are logged to console.error so they show up in Vercel logs.
 */

// ---------------------------------------------------------------------------
//  Default fallback SiteSetting (used when DB is unreachable)
// ---------------------------------------------------------------------------

const DEFAULT_SITE_SETTING: SiteSetting = {
  id: 'global',
  siteName: 'Peredam Mobil Jakarta',
  tagline: 'Review Workshop Peredam & Upgrade Audio Terbaik',
  logoUrl: null,
  faviconUrl: null,
  contactEmail: 'innovationcaraudio@gmail.com',
  contactAddress:
    'Jl. Taman Surya Boulevard 3 Blok H1 No.9, Pegadungan, Kalideres, Jakarta Barat 11830',
  contactPhone: null,
  socialFacebook: null,
  socialInstagram: null,
  socialYoutube: null,
  authorName: 'Innovation Car Audio',
  newsletterHeadline: 'Buletin Mingguan',
  newsletterSubtext:
    'Ringkasan review workshop dan panduan peredam, sekali seminggu.',
  footerCopyright:
    '© 2026 Peredam Mobil Jakarta. Seluruh hak cipta dilindungi.',
  primaryColor: 'amber',
  gaMeasurementId: null,
  gtmId: null,
  verificationGoogle: null,
  verificationBing: null,
  updatedAt: new Date(),
}

function logDbError(fn: string, err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err)
  console.error(`[portal:${fn}] DB error:`, msg)
}

export async function getSiteSetting(): Promise<SiteSetting> {
  try {
    const s = (await db.siteSetting.upsert({
      where: { id: 'global' },
      update: {},
      create: { id: 'global' },
    })) as SiteSetting
    return s
  } catch (err) {
    logDbError('getSiteSetting', err)
    return DEFAULT_SITE_SETTING
  }
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
  try {
    const featured = (await db.article.findMany({
      where: { ...PUBLISHED_WHERE, isFeatured: true },
      orderBy: [{ publishedAt: 'desc' }],
      take: minCount,
      select: articleListSelect,
    } as never)) as PortalArticleListItem[]
    if (featured.length >= minCount)
      return featured
    // Tambahan: ambil populer yg bukan featured
    const need = minCount - featured.length
    const excludeIds = featured.map((a) => a.id)
    const popular = (await db.article.findMany({
      where: { ...PUBLISHED_WHERE, id: { notIn: excludeIds } },
      orderBy: [{ viewCount: 'desc' }, { publishedAt: 'desc' }],
      take: need,
      select: articleListSelect,
    } as never)) as PortalArticleListItem[]
    return [...featured, ...popular]
  } catch (err) {
    logDbError('getFeaturedArticles', err)
    return []
  }
}

/**
 * Latest articles (default 4) — PUBLISHED, sort by publishedAt desc, exclude ids.
 */
export async function getLatestArticles(
  take = 4,
  excludeIds: string[] = [],
): Promise<PortalArticleListItem[]> {
  try {
    return (await db.article.findMany({
      where: { ...PUBLISHED_WHERE, id: { notIn: excludeIds } },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take,
      select: articleListSelect,
    } as never)) as PortalArticleListItem[]
  } catch (err) {
    logDbError('getLatestArticles', err)
    return []
  }
}

/**
 * Articles per category — top N per kategori (PUBLISHED), sort by publishedAt desc.
 * Return: array of { category, articles[] }
 */
export async function getArticlesPerCategory(
  perCategory = 4,
  excludeIds: string[] = [],
): Promise<{ category: PortalCategory; articles: PortalArticleListItem[] }[]> {
  try {
    const categories = (await db.category.findMany({
      orderBy: [{ order: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        color: true,
      },
    } as never)) as PortalCategory[]
    const result: { category: PortalCategory; articles: PortalArticleListItem[] }[] =
      []
    for (const c of categories) {
      const articles = (await db.article.findMany({
        where: {
          ...PUBLISHED_WHERE,
          categoryId: c.id,
          id: { notIn: excludeIds },
        },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: perCategory,
        select: articleListSelect,
      } as never)) as PortalArticleListItem[]
      if (articles.length > 0) {
        result.push({
          category: c,
          articles,
        })
      }
    }
    return result
  } catch (err) {
    logDbError('getArticlesPerCategory', err)
    return []
  }
}

/**
 * Paling banyak dibaca — top N by viewCount (PUBLISHED).
 */
export async function getMostReadArticles(
  take = 6,
): Promise<PortalArticleListItem[]> {
  try {
    return (await db.article.findMany({
      where: PUBLISHED_WHERE,
      orderBy: [{ viewCount: 'desc' }, { publishedAt: 'desc' }],
      take,
      select: articleListSelect,
    } as never)) as PortalArticleListItem[]
  } catch (err) {
    logDbError('getMostReadArticles', err)
    return []
  }
}

/**
 * Topik populer — top N tags by article count (only tags w/ articles).
 */
export async function getPopularTags(
  take = 12,
): Promise<PortalTag[]> {
  try {
    const tags = (await db.tag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        articles: { select: { id: true } },
      },
    } as never)) as {
      id: string
      name: string
      slug: string
      articles: { id: string }[]
    }[]
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
  } catch (err) {
    logDbError('getPopularTags', err)
    return []
  }
}

/**
 * FAQ list (published only, sort by order asc).
 */
export async function getPublishedFaqs(): Promise<PortalFaq[]> {
  try {
    return (await db.faq.findMany({
      where: { isPublished: true },
      orderBy: [{ order: 'asc' }],
      select: { id: true, question: true, answer: true, order: true },
    } as never)) as PortalFaq[]
  } catch (err) {
    logDbError('getPublishedFaqs', err)
    return []
  }
}

/* -------------------------------------------------------------------------- */
/*  Article detail + related + category list helpers                           */
/* -------------------------------------------------------------------------- */

export async function getArticleBySlug(
  slug: string,
): Promise<PortalArticleDetail | null> {
  try {
    const a = (await db.article.findFirst({
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
    } as never)) as PortalArticleDetail | null
    return a
  } catch (err) {
    logDbError('getArticleBySlug', err)
    return null
  }
}

export async function getArticleByCategoryAndSlug(
  categorySlug: string,
  articleSlug: string,
): Promise<PortalArticleDetail | null> {
  try {
    const category = (await db.category.findUnique({
      where: { slug: categorySlug },
      select: { id: true },
    } as never)) as { id: string } | null
    if (!category) return null
    const a = (await db.article.findFirst({
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
    } as never)) as PortalArticleDetail | null
    return a
  } catch (err) {
    logDbError('getArticleByCategoryAndSlug', err)
    return null
  }
}

/**
 * Related articles — same category, exclude self, top N.
 */
export async function getRelatedArticles(
  articleId: string,
  categoryId: string,
  take = 3,
): Promise<PortalArticleListItem[]> {
  try {
    return (await db.article.findMany({
      where: {
        ...PUBLISHED_WHERE,
        categoryId,
        id: { not: articleId },
      },
      orderBy: [{ publishedAt: 'desc' }],
      take,
      select: articleListSelect,
    } as never)) as PortalArticleListItem[]
  } catch (err) {
    logDbError('getRelatedArticles', err)
    return []
  }
}

/**
 * Increment viewCount — fire & forget.
 * Supabase tidak punya atomic increment, jadi fetch + compute + update.
 */
export async function incrementArticleView(slug: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('articles')
      .select('id,viewCount')
      .eq('slug', slug)
      .eq('status', 'PUBLISHED')
      .limit(1)
    if (error || !data || data.length === 0) return
    const a = data[0] as { id: string; viewCount: number }
    await supabase
      .from('articles')
      .update({ viewCount: (a.viewCount || 0) + 1 })
      .eq('id', a.id)
  } catch (err) {
    logDbError('incrementArticleView', err)
  }
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
  try {
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
      } as never),
      db.article.count({ where }),
    ])
    return {
      items: items as PortalArticleListItem[],
      total,
    }
  } catch (err) {
    logDbError('searchArticles', err)
    return { items: [], total: 0 }
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
  try {
    const category = (await db.category.findUnique({
      where: { slug: categorySlug },
      select: { id: true, name: true, slug: true, description: true, color: true },
    } as never)) as PortalCategory | null
    if (!category) return { category: null, items: [], total: 0 }
    const [items, total] = await Promise.all([
      db.article.findMany({
        where: { ...PUBLISHED_WHERE, categoryId: category.id },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        take,
        skip,
        select: articleListSelect,
      } as never),
      db.article.count({ where: { ...PUBLISHED_WHERE, categoryId: category.id } }),
    ])
    return {
      category,
      items: items as PortalArticleListItem[],
      total,
    }
  } catch (err) {
    logDbError('getArticlesByCategory', err)
    return { category: null, items: [], total: 0 }
  }
}

/**
 * Approved comments untuk artikel (public, untuk halaman detail).
 */
export async function getApprovedComments(articleId: string) {
  try {
    return (await db.comment.findMany({
      where: { articleId, status: 'APPROVED' },
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        authorName: true,
        content: true,
        createdAt: true,
      },
    } as never)) as {
      id: string
      authorName: string
      content: string
      createdAt: Date
    }[]
  } catch (err) {
    logDbError('getApprovedComments', err)
    return []
  }
}
