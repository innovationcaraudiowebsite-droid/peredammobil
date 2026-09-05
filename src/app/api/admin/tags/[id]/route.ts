import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * DELETE /api/admin/tags/[id] — delete tag.
 * If tag still has articles, the implicit m-n junction rows are auto-removed
 * (disconnect). We accept this and inform the caller with a count.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params

  const existing = await db.tag.findUnique({
    where: { id },
    select: { id: true, name: true },
  })
  if (!existing) {
    return NextResponse.json(
      { ok: false, message: 'Tag tidak ditemukan.' },
      { status: 404 },
    )
  }

  const articleCount = await db.article.count({
    where: { tags: { some: { id } } },
  })

  // Prisma auto-removes junction rows on tag delete (implicit m-n).
  await db.tag.delete({ where: { id } })

  return NextResponse.json({
    ok: true,
    disconnectedArticles: articleCount,
  })
}
