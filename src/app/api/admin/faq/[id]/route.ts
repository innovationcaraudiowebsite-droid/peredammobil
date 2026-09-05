import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

interface UpdateBody {
  question?: unknown
  answer?: unknown
  order?: unknown
  isPublished?: unknown
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
 * PUT /api/admin/faq/[id] — partial update FAQ.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params

  const existing = await db.faq.findUnique({ where: { id }, select: { id: true } })
  if (!existing) {
    return NextResponse.json(
      { ok: false, message: 'FAQ tidak ditemukan.' },
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

  if (body.question !== undefined) {
    const q = asString(body.question)
    if (!q || q.length < 5) {
      return NextResponse.json(
        { ok: false, message: 'Pertanyaan wajib minimal 5 karakter.' },
        { status: 400 },
      )
    }
    data.question = q
  }

  if (body.answer !== undefined) {
    const a = asString(body.answer)
    if (!a || a.length < 5) {
      return NextResponse.json(
        { ok: false, message: 'Jawaban wajib minimal 5 karakter.' },
        { status: 400 },
      )
    }
    data.answer = a
  }

  if (body.order !== undefined) {
    data.order = asInt(body.order, 0)
  }

  if (body.isPublished !== undefined) {
    data.isPublished = body.isPublished === true
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true, id, message: 'Tidak ada perubahan.' })
  }

  await db.faq.update({ where: { id }, data: data as never })
  return NextResponse.json({ ok: true, id })
}

/**
 * DELETE /api/admin/faq/[id] — delete FAQ.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params

  const existing = await db.faq.findUnique({ where: { id }, select: { id: true } })
  if (!existing) {
    return NextResponse.json(
      { ok: false, message: 'FAQ tidak ditemukan.' },
      { status: 404 },
    )
  }

  await db.faq.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
