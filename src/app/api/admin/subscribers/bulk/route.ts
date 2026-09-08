import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

interface BulkBody {
  ids?: unknown
  action?: unknown
}

/**
 * POST /api/admin/subscribers/bulk — bulk unsubscribe or delete.
 * Body: { ids: string[], action: 'unsubscribe' | 'delete' }
 */
export async function POST(req: NextRequest) {
  await requireAdmin()

  let body: BulkBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Body tidak valid.' }, { status: 400 })
  }

  if (!Array.isArray(body.ids)) {
    return NextResponse.json(
      { ok: false, message: 'ids harus array string.' },
      { status: 400 },
    )
  }
  const ids = (body.ids as unknown[]).filter(
    (x): x is string => typeof x === 'string' && x.length > 0,
  )
  if (ids.length === 0) {
    return NextResponse.json({ ok: false, message: 'Pilih minimal satu subscriber.' }, { status: 400 })
  }

  const action = typeof body.action === 'string' ? body.action : ''
  if (action !== 'unsubscribe' && action !== 'delete') {
    return NextResponse.json(
      { ok: false, message: 'Action harus "unsubscribe" atau "delete".' },
      { status: 400 },
    )
  }

  if (action === 'unsubscribe') {
    const result = await db.subscriber.updateMany({
      where: { id: { in: ids }, status: 'ACTIVE' },
      data: {
        status: 'UNSUBSCRIBED',
        unsubscribedAt: new Date(),
      },
    })
    return NextResponse.json({ ok: true, affected: result.count })
  }

  // action === 'delete'
  const result = await db.subscriber.deleteMany({
    where: { id: { in: ids } },
  })
  return NextResponse.json({ ok: true, affected: result.count })
}
