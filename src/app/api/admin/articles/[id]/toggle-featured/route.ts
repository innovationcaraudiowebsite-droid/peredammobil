import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * POST /api/admin/articles/[id]/toggle-featured
 * Toggle isFeatured (true → false, false → true).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params

  const article = await db.article.findUnique({ where: { id }, select: { isFeatured: true } })
  if (!article) {
    return NextResponse.json({ ok: false, message: 'Artikel tidak ditemukan.' }, { status: 404 })
  }

  // Warning bila mau nyalakan featured tapi sudah >= 5 featured lain.
  if (!article.isFeatured) {
    const featuredCount = await db.article.count({
      where: { isFeatured: true, NOT: { id } },
    })
    await db.article.update({ where: { id }, data: { isFeatured: true } })
    return NextResponse.json({
      ok: true,
      isFeatured: true,
      warning:
        featuredCount >= 5
          ? 'Sudah ada 5 artikel featured lain. Pertimbangkan untuk mematikan salah satunya.'
          : undefined,
    })
  }

  await db.article.update({ where: { id }, data: { isFeatured: false } })
  return NextResponse.json({ ok: true, isFeatured: false })
}
