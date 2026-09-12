import { NextRequest, NextResponse } from 'next/server'

import { requireAdminApi } from '@/lib/auth'
import { db } from '@/lib/db'
import { slugify, ensureUniqueSlug } from '@/lib/slug'
import {
  calculateReadingTime,
  calculateWordCount,
  renderMarkdownToHtml,
} from '@/lib/article'

export const runtime = 'nodejs'

interface CreateArticleBody {
  title?: unknown
  slug?: unknown
  excerpt?: unknown
  contentMarkdown?: unknown
  featuredImageUrl?: unknown
  featuredImageAlt?: unknown
  categoryId?: unknown
  authorName?: unknown
  status?: unknown
  isFeatured?: unknown
  isBreaking?: unknown
  metaTitle?: unknown
  metaDescription?: unknown
  metaKeywords?: unknown
  ogImageUrl?: unknown
  targetKeyword?: unknown
  publishedAt?: unknown
  tagIds?: unknown
}

function asString(v: unknown, max?: number): string | undefined {
  if (typeof v !== 'string') return undefined
  const trimmed = v.trim()
  if (trimmed === '') return undefined
  return max ? trimmed.slice(0, max) : trimmed
}

/**
 * POST /api/admin/articles — create new article.
 * Validasi: title wajib (>= 5 char), categoryId wajib.
 * Untuk publish (status=PUBLISHED): konten minimal 100 char.
 */
export async function POST(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  let body: CreateArticleBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Body tidak valid.' }, { status: 400 })
  }

  const title = asString(body.title)
  if (!title || title.length < 5) {
    return NextResponse.json(
      { ok: false, message: 'Judul artikel wajib minimal 5 karakter.' },
      { status: 400 },
    )
  }

  const categoryId = asString(body.categoryId)
  if (!categoryId) {
    return NextResponse.json(
      { ok: false, message: 'Kategori wajib dipilih.' },
      { status: 400 },
    )
  }

  const category = await db.category.findUnique({ where: { id: categoryId } })
  if (!category) {
    return NextResponse.json({ ok: false, message: 'Kategori tidak ditemukan.' }, { status: 400 })
  }

  const contentMarkdown = asString(body.contentMarkdown) ?? ''
  const statusRaw = asString(body.status) ?? 'DRAFT'
  if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(statusRaw)) {
    return NextResponse.json({ ok: false, message: 'Status tidak valid.' }, { status: 400 })
  }

  if (statusRaw === 'PUBLISHED' && contentMarkdown.trim().length < 100) {
    return NextResponse.json(
      { ok: false, message: 'Konten artikel minimal 100 karakter untuk dipublikasikan.' },
      { status: 400 },
    )
  }

  // Slug
  const requestedSlug = asString(body.slug)
  const baseSlug = slugify(requestedSlug || title)
  if (!baseSlug) {
    return NextResponse.json({ ok: false, message: 'Slug tidak valid.' }, { status: 400 })
  }
  const finalSlug = await ensureUniqueSlug(baseSlug, async (s) => {
    const found = await db.article.findUnique({ where: { slug: s }, select: { id: true } })
    return !!found
  })

  // Auto-calc
  const wordCount = calculateWordCount(contentMarkdown)
  const readingTimeMinutes = calculateReadingTime(contentMarkdown)
  const contentHtml = renderMarkdownToHtml(contentMarkdown)

  // Auto-fallback SEO
  const metaTitle = asString(body.metaTitle, 70) ?? title.slice(0, 70)
  const metaDescription =
    asString(body.metaDescription, 200) ?? asString(body.excerpt, 200) ?? ''
  const tagIdsArr = Array.isArray(body.tagIds)
    ? (body.tagIds as unknown[]).filter(
        (x): x is string => typeof x === 'string' && x.length > 0,
      )
    : []
  // Resolve pseudo tag IDs ("new:<name>") menjadi tag baru di DB.
  const finalTagIds: string[] = []
  for (const tid of tagIdsArr) {
    if (tid.startsWith('new:')) {
      const name = tid.slice(4).trim()
      if (!name) continue
      const slug = slugify(name)
      const upserted = await db.tag.upsert({
        where: { slug },
        create: { name, slug },
        update: {},
      })
      finalTagIds.push(upserted.id)
    } else {
      finalTagIds.push(tid)
    }
  }
  // Untuk metaKeywords fallback, fetch tag names dari DB.
  let metaKeywords = asString(body.metaKeywords)
  if (!metaKeywords && finalTagIds.length > 0) {
    const tagRecords = await db.tag.findMany({
      where: { id: { in: finalTagIds } },
      select: { name: true },
    })
    metaKeywords = tagRecords.map((t) => t.name).join(', ')
  }

  // publishedAt
  let publishedAt: Date | null = null
  if (statusRaw === 'PUBLISHED' || statusRaw === 'ARCHIVED') {
    const provided = asString(body.publishedAt)
    if (provided) {
      const d = new Date(provided)
      if (!Number.isNaN(d.getTime())) publishedAt = d
    }
    if (!publishedAt && statusRaw === 'PUBLISHED') publishedAt = new Date()
  }

  const article = await db.article.create({
    data: {
      title,
      slug: finalSlug,
      excerpt: asString(body.excerpt, 280) ?? null,
      content: contentHtml,
      contentMarkdown,
      featuredImageUrl: asString(body.featuredImageUrl) ?? null,
      featuredImageAlt: asString(body.featuredImageAlt) ?? null,
      categoryId,
      authorName: asString(body.authorName) ?? 'Innovation Car Audio',
      status: statusRaw,
      isFeatured: body.isFeatured === true,
      isBreaking: body.isBreaking === true,
      metaTitle,
      metaDescription,
      metaKeywords: metaKeywords || null,
      ogImageUrl: asString(body.ogImageUrl) ?? null,
      targetKeyword: asString(body.targetKeyword, 120) ?? null,
      readingTimeMinutes,
      wordCount,
      viewCount: 0,
      shareCount: 0,
      publishedAt,
      tags: finalTagIds.length
        ? { connect: finalTagIds.map((id) => ({ id })) }
        : undefined,
    },
  })

  // Buat ArticleVersion snapshot pertama saat publish
  if (statusRaw === 'PUBLISHED') {
    const lastVer = await db.articleVersion.findFirst({
      where: { articleId: article.id },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    })
    const nextVer = (lastVer?.versionNumber ?? 0) + 1
    await db.articleVersion.create({
      data: {
        articleId: article.id,
        versionNumber: nextVer,
        title,
        content: contentMarkdown,
        excerpt: asString(body.excerpt, 280) ?? null,
        editedBy: 'admin',
        editNote: 'Versi awal saat publish',
      },
    })
  }

  return NextResponse.json({ ok: true, id: article.id, slug: article.slug })
}
