import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

interface BulkBody {
  ids?: unknown
  action?: unknown
}

/**
 * POST /api/admin/articles/bulk
 * Body: { ids: string[], action: "publish" | "archive" | "delete" }
 */
export async function POST(req: NextRequest) {
  await requireAdmin()

  let body: BulkBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Body tidak valid.' }, { status: 400 })
  }

  const ids = Array.isArray(body.ids)
    ? (body.ids as unknown[]).filter((x): x is string => typeof x === 'string' && x.length > 0)
    : []
  if (ids.length === 0) {
    return NextResponse.json({ ok: false, message: 'Pilih minimal satu artikel.' }, { status: 400 })
  }

  const action = typeof body.action === 'string' ? body.action : ''
  if (!['publish', 'archive', 'delete'].includes(action)) {
    return NextResponse.json({ ok: false, message: 'Action tidak valid.' }, { status: 400 })
  }

  if (action === 'delete') {
    // Cascade akan hapus ArticleVersion + Comment + ArticleTag junction otomatis
    const r = await db.article.deleteMany({ where: { id: { in: ids } } })
    return NextResponse.json({ ok: true, affected: r.count })
  }

  if (action === 'publish') {
    const now = new Date()
    const r = await db.article.updateMany({
      where: { id: { in: ids }, status: { not: 'PUBLISHED' } },
      data: { status: 'PUBLISHED', publishedAt: now },
    })
    return NextResponse.json({ ok: true, affected: r.count })
  }

  // archive
  const r = await db.article.updateMany({
    where: { id: { in: ids }, status: { not: 'ARCHIVED' } },
    data: { status: 'ARCHIVED' },
  })
  return NextResponse.json({ ok: true, affected: r.count })
}
