import { NextRequest, NextResponse } from 'next/server'

import { requireAdminApi } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

interface CreateBody {
  name?: unknown
  description?: unknown
  price?: unknown
  category?: unknown
  imageUrl?: unknown
  imageAlt?: unknown
  waNumber?: unknown
  order?: unknown
  isActive?: unknown
}

function asString(v: unknown, max?: number): string | undefined {
  if (typeof v !== 'string') return undefined
  const trimmed = v.trim()
  if (trimmed === '') return undefined
  return max ? trimmed.slice(0, max) : trimmed
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
 * GET /api/admin/products — list all products (for admin dashboard).
 * Optional query: ?category=Paket%20Layanan&active=true
 */
export async function GET(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const activeOnly = searchParams.get('active') === 'true'

  const where: Record<string, unknown> = {}
  if (category) where.category = category
  if (activeOnly) where.isActive = true

  try {
    const products = await db.product.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json({ ok: true, products })
  } catch (err) {
    console.error('[api/admin/products GET] error:', err)
    return NextResponse.json({ ok: false, message: 'Gagal memuat produk.' }, { status: 500 })
  }
}

/**
 * POST /api/admin/products — create new product.
 * Required: name, category, waNumber.
 */
export async function POST(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  let body: CreateBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Body tidak valid.' }, { status: 400 })
  }

  const name = asString(body.name, 120)
  if (!name || name.length < 3) {
    return NextResponse.json(
      { ok: false, message: 'Nama produk wajib minimal 3 karakter.' },
      { status: 400 },
    )
  }

  const category = asString(body.category, 60)
  if (!category) {
    return NextResponse.json(
      { ok: false, message: 'Kategori wajib diisi.' },
      { status: 400 },
    )
  }

  const waNumber = asString(body.waNumber, 20)
  if (!waNumber) {
    return NextResponse.json(
      { ok: false, message: 'Nomor WA admin wajib diisi.' },
      { status: 400 },
    )
  }

  try {
    const product = await db.product.create({
      data: {
        name,
        description: asString(body.description, 500) ?? null,
        price: asString(body.price, 60) ?? null,
        category,
        imageUrl: asString(body.imageUrl) ?? null,
        imageAlt: asString(body.imageAlt, 120) ?? null,
        waNumber,
        order: asInt(body.order, 0),
        isActive: body.isActive !== false, // default true
      },
    })
    return NextResponse.json({ ok: true, id: (product as { id: string }).id })
  } catch (err) {
    console.error('[api/admin/products POST] error:', err)
    return NextResponse.json({ ok: false, message: 'Gagal membuat produk.' }, { status: 500 })
  }
}
