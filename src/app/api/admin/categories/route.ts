import { NextRequest, NextResponse } from 'next/server'

import { requireAdminApi } from '@/lib/auth'
import { db } from '@/lib/db'
import { slugify, ensureUniqueSlug } from '@/lib/slug'

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

interface CreateBody {
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

function asColor(v: unknown): AllowedColor {
  if (typeof v === 'string' && (ALLOWED_COLORS as readonly string[]).includes(v)) {
    return v as AllowedColor
  }
  return 'amber'
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
 * POST /api/admin/categories — create a new category.
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
      { ok: false, message: 'Nama kategori wajib minimal 2 karakter.' },
      { status: 400 },
    )
  }

  // Cek nama unik
  const existingByName = await db.category.findUnique({
    where: { name },
    select: { id: true },
  })
  if (existingByName) {
    return NextResponse.json(
      { ok: false, message: 'Nama kategori sudah dipakai.' },
      { status: 400 },
    )
  }

  // Slug
  const requestedSlug = asString(body.slug)
  const baseSlug = slugify(requestedSlug || name)
  if (!baseSlug) {
    return NextResponse.json(
      { ok: false, message: 'Slug tidak valid.' },
      { status: 400 },
    )
  }
  const finalSlug = await ensureUniqueSlug(baseSlug, async (s) => {
    const found = await db.category.findUnique({ where: { slug: s }, select: { id: true } })
    return !!found
  })

  const description = asString(body.description, 280) ?? null
  const color = asColor(body.color)
  const order = asInt(body.order, 0)

  const category = await db.category.create({
    data: {
      name,
      slug: finalSlug,
      description,
      color,
      order,
    },
    select: { id: true, slug: true },
  })

  return NextResponse.json({ ok: true, id: category.id, slug: category.slug })
}
