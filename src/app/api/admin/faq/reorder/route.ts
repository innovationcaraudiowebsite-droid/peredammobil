import { NextRequest, NextResponse } from 'next/server'

import { requireAdminApi } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

interface ReorderBody {
  ids?: unknown
}

/**
 * POST /api/admin/faq/reorder — bulk reorder FAQ.
 * Body: { ids: string[] } — IDs in the new desired order.
 * Each FAQ's `order` field is set to its index in the array.
 * IDs not in the array keep their current order.
 */
export async function POST(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  let body: ReorderBody
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
    return NextResponse.json({ ok: true, updated: 0 })
  }

  // Update each in parallel — order is small int (index) so collisions are unlikely.
  await Promise.all(
    ids.map((id, idx) =>
      db.faq.update({
        where: { id },
        data: { order: idx + 1 },
        select: { id: true },
      }).catch(() => null), // ignore missing IDs
    ),
  )

  return NextResponse.json({ ok: true, updated: ids.length })
}
