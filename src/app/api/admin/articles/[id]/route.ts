import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { slugify } from '@/lib/slug'
import {
  calculateReadingTime,
  calculateWordCount,
  renderMarkdownToHtml,
} from '@/lib/article'

export const runtime = 'nodejs'

interface UpdateBody {
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
 * GET /api/admin/articles/[id] — fetch single article for edit.
 * Public-ish to authenticated admin; returns full article + tags + category.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params

  const article = await db.article.findUnique({
    where: { id },
    include: {
      category: true,
      tags: true,
      versions: { orderBy: { versionNumber: 'desc' } },
    },
  })
  if (!article) {
    return NextResponse.json({ ok: false, message: 'Artikel tidak ditemukan.' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, article })
}

/**
 * PUT /api/admin/articles/[id] — update article (partial update).
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params

  const existing = await db.article.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ ok: false, message: 'Artikel tidak ditemukan.' }, { status: 404 })
  }

  let body: UpdateBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Body tidak valid.' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}

  const title = asString(body.title)
  if (title !== undefined) {
    if (title.length < 5) {
      return NextResponse.json(
        { ok: false, message: 'Judul artikel wajib minimal 5 karakter.' },
        { status: 400 },
      )
    }
    data.title = title
  }

  // Slug update — keep uniqueness, exclude self.
  if (body.slug !== undefined) {
    const requestedSlug = asString(body.slug)
    const baseSlug = slugify(requestedSlug || (title ?? existing.title))
    if (baseSlug) {
      const conflict = await db.article.findFirst({
        where: { slug: baseSlug, NOT: { id } },
        select: { id: true },
      })
      if (conflict) {
        // suffix with -2, -3 ...
        let i = 2
        let unique = baseSlug
        while (true) {
          unique = `${baseSlug}-${i}`
          const c = await db.article.findFirst({
            where: { slug: unique, NOT: { id } },
            select: { id: true },
          })
          if (!c) break
          i++
          if (i > 100) {
            unique = `${baseSlug}-${Date.now()}`
            break
          }
        }
        data.slug = unique
      } else {
        data.slug = baseSlug
      }
    }
  }

  if (body.excerpt !== undefined) data.excerpt = asString(body.excerpt, 280) ?? null

  // Konten — re-render HTML, re-calc word count, reading time.
  if (body.contentMarkdown !== undefined) {
    const md = asString(body.contentMarkdown) ?? ''
    data.contentMarkdown = md
    data.content = renderMarkdownToHtml(md)
    data.wordCount = calculateWordCount(md)
    data.readingTimeMinutes = calculateReadingTime(md)
  }

  if (body.featuredImageUrl !== undefined)
    data.featuredImageUrl = asString(body.featuredImageUrl) ?? null
  if (body.featuredImageAlt !== undefined)
    data.featuredImageAlt = asString(body.featuredImageAlt) ?? null

  if (body.categoryId !== undefined) {
    const cat = asString(body.categoryId)
    if (cat) {
      const found = await db.category.findUnique({ where: { id: cat } })
      if (!found) {
        return NextResponse.json(
          { ok: false, message: 'Kategori tidak ditemukan.' },
          { status: 400 },
        )
      }
      data.categoryId = cat
    }
  }

  if (body.authorName !== undefined)
    data.authorName = asString(body.authorName) ?? 'Innovation Car Audio'

  if (body.status !== undefined) {
    const s = asString(body.status)
    if (s && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(s)) {
      data.status = s
      // Set publishedAt bila publish pertama kali
      if (s === 'PUBLISHED' && !existing.publishedAt && body.publishedAt === undefined) {
        data.publishedAt = new Date()
      }
    }
  }

  if (body.isFeatured !== undefined) data.isFeatured = body.isFeatured === true
  if (body.isBreaking !== undefined) data.isBreaking = body.isBreaking === true

  if (body.metaTitle !== undefined) {
    const t = asString(body.metaTitle, 70)
    data.metaTitle = t ?? (title ?? existing.title).slice(0, 70)
  }
  if (body.metaDescription !== undefined) {
    const d = asString(body.metaDescription, 200)
    data.metaDescription = d ?? asString(body.excerpt, 200) ?? existing.excerpt ?? null
  }
  if (body.metaKeywords !== undefined)
    data.metaKeywords = asString(body.metaKeywords) ?? null
  if (body.ogImageUrl !== undefined)
    data.ogImageUrl = asString(body.ogImageUrl) ?? null

  if (body.publishedAt !== undefined) {
    const p = asString(body.publishedAt)
    data.publishedAt = p ? new Date(p) : null
  }

  // Tags — setiap update replace seluruhnya. Resolve pseudo IDs "new:<name>".
  if (body.tagIds !== undefined) {
    const tagIdsArr = Array.isArray(body.tagIds)
      ? (body.tagIds as unknown[]).filter(
          (x): x is string => typeof x === 'string' && x.length > 0,
        )
      : []
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
    data.tags = { set: [], connect: finalTagIds.map((tid) => ({ id: tid })) }
  }

  await db.article.update({ where: { id }, data: data as never })

  // Bila status baru dipublish (DRAFT/ARCHIVED → PUBLISHED), buat snapshot versi baru.
  if (
    data.status === 'PUBLISHED' &&
    existing.status !== 'PUBLISHED'
  ) {
    const updated = await db.article.findUnique({
      where: { id },
      select: { title: true, contentMarkdown: true, excerpt: true },
    })
    if (updated) {
      const last = await db.articleVersion.findFirst({
        where: { articleId: id },
        orderBy: { versionNumber: 'desc' },
        select: { versionNumber: true },
      })
      const nextVer = (last?.versionNumber ?? 0) + 1
      await db.articleVersion.create({
        data: {
          articleId: id,
          versionNumber: nextVer,
          title: updated.title,
          content: updated.contentMarkdown ?? '',
          excerpt: updated.excerpt,
          editedBy: 'admin',
          editNote: 'Snapshot saat publish',
        },
      })
    }
  }

  return NextResponse.json({ ok: true, id })
}

/**
 * DELETE /api/admin/articles/[id] — hapus artikel beserta relasi (cascade).
 * ArticleVersion & Comment sudah onDelete: Cascade; ArticleTag junction otomatis dihapus oleh Prisma.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params

  const existing = await db.article.findUnique({ where: { id }, select: { id: true } })
  if (!existing) {
    return NextResponse.json({ ok: false, message: 'Artikel tidak ditemukan.' }, { status: 404 })
  }

  await db.article.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
