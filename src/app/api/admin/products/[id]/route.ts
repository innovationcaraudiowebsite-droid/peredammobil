import { NextRequest, NextResponse } from 'next/server'

import { requireAdminApi } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

interface UpdateBody {
  name?: unknown
  description?: unknown
  price?: unknown
  category?: unknown
  imageUrl?: unknown
  imageAlt?: unknown
  waNumber?: unknown
  sortOrder?: unknown
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
 * GET /api/admin/products/[id] — fetch single product for edit.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const product = await db.product.findUnique({ where: { id } })
  if (!product) {
    return NextResponse.json({ ok: false, message: 'Produk tidak ditemukan.' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, product })
}

/**
 * PUT /api/admin/products/[id] — update product.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await db.product.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ ok: false, message: 'Produk tidak ditemukan.' }, { status: 404 })
  }

  let body: UpdateBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Body tidak valid.' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}

  const name = asString(body.name, 120)
  if (name !== undefined) {
    if (name.length < 3) {
      return NextResponse.json(
        { ok: false, message: 'Nama produk wajib minimal 3 karakter.' },
        { status: 400 },
      )
    }
    data.name = name
  }

  if (body.description !== undefined) data.description = asString(body.description, 500) ?? null
  if (body.price !== undefined) data.price = asString(body.price, 60) ?? null
  if (body.category !== undefined) {
    const cat = asString(body.category, 60)
    if (cat) data.category = cat
  }
  if (body.imageUrl !== undefined) data.imageUrl = asString(body.imageUrl) ?? null
  if (body.imageAlt !== undefined) data.imageAlt = asString(body.imageAlt, 120) ?? null
  if (body.waNumber !== undefined) {
    const wa = asString(body.waNumber, 20)
    if (wa) data.waNumber = wa
  }
  if (body.sortOrder !== undefined) data.sortOrder = asInt(body.sortOrder, 0)
  if (body.isActive !== undefined) data.isActive = body.isActive === true

  try {
    await db.product.update({ where: { id }, data })
    return NextResponse.json({ ok: true, id })
  } catch (err) {
    console.error('[api/admin/products PUT] error:', err)
    return NextResponse.json({ ok: false, message: 'Gagal update produk.' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/products/[id] — hapus product.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await db.product.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ ok: false, message: 'Produk tidak ditemukan.' }, { status: 404 })
  }

  try {
    await db.product.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/admin/products DELETE] error:', err)
    return NextResponse.json({ ok: false, message: 'Gagal hapus produk.' }, { status: 500 })
  }
}
