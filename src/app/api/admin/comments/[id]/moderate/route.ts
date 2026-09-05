import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

const VALID_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'SPAM'] as const

interface ModerateBody {
  status?: unknown
}

/**
 * POST /api/admin/comments/[id]/moderate
 * Body: { status: "APPROVED"|"REJECTED"|"SPAM" }
 * Ubah status komentar. PENDING juga di-allow untuk unflag.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params

  let body: ModerateBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Body tidak valid.' }, { status: 400 })
  }

  const status = typeof body.status === 'string' ? body.status.toUpperCase() : ''
  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json(
      { ok: false, message: `Status harus salah satu dari: ${VALID_STATUSES.join(', ')}.` },
      { status: 400 },
    )
  }

  const existing = await db.comment.findUnique({
    where: { id },
    select: { id: true, authorName: true, status: true },
  })
  if (!existing) {
    return NextResponse.json({ ok: false, message: 'Komentar tidak ditemukan.' }, { status: 404 })
  }

  const updated = await db.comment.update({
    where: { id },
    data: { status },
    select: { id: true, status: true },
  })

  return NextResponse.json({
    ok: true,
    id: updated.id,
    status: updated.status,
    previousStatus: existing.status,
  })
}
