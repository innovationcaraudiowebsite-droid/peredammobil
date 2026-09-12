import { NextRequest, NextResponse } from 'next/server'

import { requireAdminApi } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

interface CreateBody {
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
 * GET /api/admin/faq — list all FAQ ordered by order asc.
 */
export async function GET() {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const faqs = await db.faq.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })

  const rows = faqs.map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
    order: f.order,
    isPublished: f.isPublished,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  }))

  return NextResponse.json({ ok: true, faqs: rows })
}

/**
 * POST /api/admin/faq — create a new FAQ.
 * Validation: question & answer wajib (>= 5 char). Order default = next order.
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

  const question = asString(body.question)
  if (!question || question.length < 5) {
    return NextResponse.json(
      { ok: false, message: 'Pertanyaan wajib minimal 5 karakter.' },
      { status: 400 },
    )
  }

  const answer = asString(body.answer)
  if (!answer || answer.length < 5) {
    return NextResponse.json(
      { ok: false, message: 'Jawaban wajib minimal 5 karakter.' },
      { status: 400 },
    )
  }

  // Order: jika tidak diberikan, ambil max+1 (next order)
  let order = asInt(body.order, -1)
  if (order < 0) {
    const maxOrder = await db.faq.aggregate({ _max: { order: true } })
    order = (maxOrder._max.order ?? 0) + 1
  }

  const isPublished = body.isPublished !== false

  const faq = await db.faq.create({
    data: {
      question,
      answer,
      order,
      isPublished,
    },
    select: { id: true, order: true },
  })

  return NextResponse.json({ ok: true, id: faq.id, order: faq.order })
}
