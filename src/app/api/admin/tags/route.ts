import { NextRequest, NextResponse } from 'next/server'

import { requireAdminApi } from '@/lib/auth'
import { db } from '@/lib/db'
import { slugify, ensureUniqueSlug } from '@/lib/slug'

export const runtime = 'nodejs'

interface CreateBody {
  name?: unknown
  slug?: unknown
}

function asString(v: unknown, max?: number): string | undefined {
  if (typeof v !== 'string') return undefined
  const trimmed = v.trim()
  if (trimmed === '') return undefined
  return max ? trimmed.slice(0, max) : trimmed
}

/**
 * GET /api/admin/tags?q=... — list tags, optionally filtered by name.
 * Returns id, name, slug, createdAt, _count.articles. Sorted by createdAt desc.
 */
export async function GET(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  const where = q ? { name: { contains: q } } : {}

  const tags = await db.tag.findMany({
    where,
    orderBy: [{ name: 'asc' }],
    include: {
      _count: {
        select: { articles: true },
      },
    },
    take: 500,
  })

  const rows = tags.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    createdAt: t.createdAt.toISOString(),
    articleCount: t._count.articles,
  }))

  return NextResponse.json({ ok: true, tags: rows })
}

/**
 * POST /api/admin/tags — create a new tag.
 * Validation: name wajib (>= 2 char). Slug auto from name if empty, must be unique.
 */
export async function POST(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  let body: CreateBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Body tidak valid.' }, { status: 400 })
  }

  const name = asString(body.name)
  if (!name || name.length < 2) {
    return NextResponse.json(
      { ok: false, message: 'Nama tag wajib minimal 2 karakter.' },
      { status: 400 },
    )
  }

  // Cek nama unik
  const existing = await db.tag.findUnique({ where: { name }, select: { id: true } })
  if (existing) {
    return NextResponse.json(
      { ok: false, message: 'Nama tag sudah dipakai.' },
      { status: 400 },
    )
  }

  const requestedSlug = asString(body.slug)
  const baseSlug = slugify(requestedSlug || name)
  if (!baseSlug) {
    return NextResponse.json({ ok: false, message: 'Slug tidak valid.' }, { status: 400 })
  }
  const finalSlug = await ensureUniqueSlug(baseSlug, async (s) => {
    const found = await db.tag.findUnique({ where: { slug: s }, select: { id: true } })
    return !!found
  })

  const tag = await db.tag.create({
    data: { name, slug: finalSlug },
    select: { id: true, slug: true },
  })

  return NextResponse.json({ ok: true, id: tag.id, slug: tag.slug })
}
