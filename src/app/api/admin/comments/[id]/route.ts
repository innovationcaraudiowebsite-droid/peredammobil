import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * DELETE /api/admin/comments/[id] — hapus komentar permanen.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params

  const existing = await db.comment.findUnique({
    where: { id },
    select: { id: true, authorName: true, content: true },
  })
  if (!existing) {
    return NextResponse.json({ ok: false, message: 'Komentar tidak ditemukan.' }, { status: 404 })
  }

  await db.comment.delete({ where: { id } })
  return NextResponse.json({ ok: true, id })
}
