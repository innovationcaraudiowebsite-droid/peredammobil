import { NextRequest, NextResponse } from 'next/server'

import { requireAdminApi } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

type BulkAction = 'approve' | 'reject' | 'spam' | 'delete'

const ACTION_TO_STATUS: Record<Exclude<BulkAction, 'delete'>, string> = {
  approve: 'APPROVED',
  reject: 'REJECTED',
  spam: 'SPAM',
}

interface BulkBody {
  ids?: unknown
  action?: unknown
}

/**
 * POST /api/admin/comments/bulk
 * Body: { ids: string[], action: "approve"|"reject"|"spam"|"delete" }
 * Return { affected: number }.
 */
export async function POST(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  let body: BulkBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Body tidak valid.' }, { status: 400 })
  }

  if (!Array.isArray(body.ids)) {
    return NextResponse.json({ ok: false, message: 'ids harus array string.' }, { status: 400 })
  }
  const ids = (body.ids as unknown[]).filter(
    (x): x is string => typeof x === 'string' && x.length > 0,
  )
  if (ids.length === 0) {
    return NextResponse.json(
      { ok: false, message: 'Pilih minimal satu komentar.' },
      { status: 400 },
    )
  }

  const action = typeof body.action === 'string' ? (body.action as BulkAction) : ''
  const validActions: BulkAction[] = ['approve', 'reject', 'spam', 'delete']
  if (!validActions.includes(action)) {
    return NextResponse.json(
      { ok: false, message: 'Action harus salah satu dari: approve, reject, spam, delete.' },
      { status: 400 },
    )
  }

  if (action === 'delete') {
    const result = await db.comment.deleteMany({ where: { id: { in: ids } } })
    return NextResponse.json({ ok: true, affected: result.count, action })
  }

  const newStatus = ACTION_TO_STATUS[action]
  const result = await db.comment.updateMany({
    where: { id: { in: ids } },
    data: { status: newStatus },
  })
  return NextResponse.json({ ok: true, affected: result.count, action, status: newStatus })
}
