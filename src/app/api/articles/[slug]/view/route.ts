import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * POST /api/articles/[slug]/view
 *
 * Public, no auth. Increment viewCount artikel PUBLISHED dengan slug tertentu.
 * Idempotent di sisi endpoint (selalu increment). Front-end bertanggung jawab memanggil
 * sekali per session (gunakan sessionStorage untuk mencegah double-count pada reload).
 *
 * Response: { ok: true } atau 404 jika artikel tidak ditemukan.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params
  if (!slug || slug.length > 250) {
    return NextResponse.json({ ok: false, message: 'slug tidak valid.' }, { status: 400 })
  }

  // Pakai updateMany — return count, lebih efisien daripada findFirst lalu update.
  const result = await db.article.updateMany({
    where: { slug, status: 'PUBLISHED' },
    data: { viewCount: { increment: 1 } },
  })

  if (result.count === 0) {
    return NextResponse.json(
      { ok: false, message: 'Artikel tidak ditemukan.' },
      { status: 404 },
    )
  }
  return NextResponse.json({ ok: true })
}
