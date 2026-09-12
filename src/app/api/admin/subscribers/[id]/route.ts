import { NextRequest, NextResponse } from 'next/server'

import { requireAdminApi } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * DELETE /api/admin/subscribers/[id] — delete subscriber permanently.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const existing = await db.subscriber.findUnique({
    where: { id },
    select: { id: true, email: true },
  })
  if (!existing) {
    return NextResponse.json(
      { ok: false, message: 'Subscriber tidak ditemukan.' },
      { status: 404 },
    )
  }

  await db.subscriber.delete({ where: { id } })
  return NextResponse.json({ ok: true, email: existing.email })
}
