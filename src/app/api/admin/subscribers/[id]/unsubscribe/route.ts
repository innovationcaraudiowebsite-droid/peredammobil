import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * POST /api/admin/subscribers/[id]/unsubscribe — set status UNSUBSCRIBED + timestamp.
 * Idempotent — if already UNSUBSCRIBED, just updates the timestamp.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params

  const existing = await db.subscriber.findUnique({
    where: { id },
    select: { id: true, email: true, status: true },
  })
  if (!existing) {
    return NextResponse.json(
      { ok: false, message: 'Subscriber tidak ditemukan.' },
      { status: 404 },
    )
  }

  await db.subscriber.update({
    where: { id },
    data: {
      status: 'UNSUBSCRIBED',
      unsubscribedAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true, email: existing.email })
}
