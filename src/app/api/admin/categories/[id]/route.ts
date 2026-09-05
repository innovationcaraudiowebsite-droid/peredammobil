import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { slugify } from '@/lib/slug'

export const runtime = 'nodejs'

const ALLOWED_COLORS = [
  'amber',
  'red',
  'emerald',
  'slate',
  'zinc',
  'violet',
  'rose',
  'cyan',
] as const

type AllowedColor = (typeof ALLOWED_COLORS)[number]

interface UpdateBody {
  name?: unknown
  slug?: unknown
  description?: unknown
  color?: unknown
  order?: unknown
}

function asString(v: unknown, max?: number): string | undefined {
  if (typeof v !== 'string') return undefined
  const trimmed = v.trim()
  if (trimmed === '') return undefined
  return max ? trimmed.slice(0, max) : trimmed
}

function asColor(v: unknown): AllowedColor | undefined {
  if (typeof v === 'string' && (ALLOWED_COLORS as readonly string[]).includes(v)) {
    return v as AllowedColor
  }
  return undefined
}

function asInt(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.trunc(v)
  if (typeof v === 'string') {
    const n = parseInt(v, 10)
    if (!Number.isNaN(n)) return n
  }
  return fallback
}

/**
 * PUT /api/admin/categories/[id] — partial update category.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params

  const existing = await db.category.findUnique({ where: { id }, select: { id: true, name: true } })
  if (!existing) {
    return NextResponse.json(
      { ok: false, message: 'Kategori tidak ditemukan.' },
      { status: 404 },
    )
  }

  let body: UpdateBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Body tidak valid.' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}

  if (body.name !== undefined) {
    const name = asString(body.name)
    if (!name || name.length < 2) {
      return NextResponse.json(
        { ok: false, message: 'Nama kategori wajib minimal 2 karakter.' },
        { status: 400 },
      )
    }
    if (name !== existing.name) {
      const other = await db.category.findUnique({ where: { name }, select: { id: true } })
      if (other && other.id !== id) {
        return NextResponse.json(
          { ok: false, message: 'Nama kategori sudah dipakai.' },
          { status: 400 },
        )
      }
    }
    data.name = name
  }

  // Slug
  if (body.slug !== undefined) {
    const requestedSlug = asString(body.slug)
    const baseSlug = slugify(requestedSlug || (data.name as string) || existing.name)
    if (baseSlug) {
      const conflict = await db.category.findFirst({
        where: { slug: baseSlug, NOT: { id } },
        select: { id: true },
      })
      if (conflict) {
        let i = 2
        let unique = baseSlug
        while (i < 100) {
          unique = `${baseSlug}-${i}`
          const c = await db.category.findFirst({
            where: { slug: unique, NOT: { id } },
            select: { id: true },
          })
          if (!c) break
          i++
        }
        if (i >= 100) unique = `${baseSlug}-${Date.now()}`
        data.slug = unique
      } else {
        data.slug = baseSlug
      }
    }
  }

  if (body.description !== undefined) {
    data.description = asString(body.description, 280) ?? null
  }

  if (body.color !== undefined) {
    const c = asColor(body.color)
    if (c) data.color = c
  }

  if (body.order !== undefined) {
    data.order = asInt(body.order, 0)
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true, id, message: 'Tidak ada perubahan.' })
  }

  await db.category.update({ where: { id }, data: data as never })
  return NextResponse.json({ ok: true, id })
}

/**
 * DELETE /api/admin/categories/[id] — delete category.
 * Validation: cannot delete if category still has articles.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params

  const existing = await db.category.findUnique({
    where: { id },
    select: { id: true, name: true },
  })
  if (!existing) {
    return NextResponse.json(
      { ok: false, message: 'Kategori tidak ditemukan.' },
      { status: 404 },
    )
  }

  const articleCount = await db.article.count({ where: { categoryId: id } })
  if (articleCount > 0) {
    return NextResponse.json(
      {
        ok: false,
        message: `Tidak bisa hapus kategori yang masih dipakai ${articleCount} artikel. Pindahkan artikel ke kategori lain dulu.`,
        articleCount,
      },
      { status: 409 },
    )
  }

  await db.category.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
