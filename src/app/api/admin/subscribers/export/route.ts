import { NextRequest, NextResponse } from 'next/server'

import { requireAdminApi } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * GET /api/admin/subscribers/export?status=active|all — return CSV.
 * Defaults to active subscribers only.
 *
 * CSV columns: email, status, source, subscribedAt, unsubscribedAt
 */
export async function GET(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const statusParam = (url.searchParams.get('status') ?? 'active').toLowerCase()
  const includeUnsubscribed = statusParam === 'all'

  const where = includeUnsubscribed ? {} : { status: 'ACTIVE' as const }

  const subscribers = await db.subscriber.findMany({
    where,
    orderBy: [{ subscribedAt: 'desc' }],
    select: {
      email: true,
      status: true,
      source: true,
      subscribedAt: true,
      unsubscribedAt: true,
    },
    take: 10000,
  })

  // CSV escape: wrap field in quotes if it contains comma, quote, or newline.
  function csvEscape(value: string | null | undefined): string {
    if (value == null) return ''
    const s = String(value)
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  function dateCell(d: Date | null): string {
    if (!d) return ''
    return d.toISOString()
  }

  const header = ['email', 'status', 'source', 'subscribedAt', 'unsubscribedAt']
  const rows = subscribers.map((s) =>
    [
      csvEscape(s.email),
      csvEscape(s.status),
      csvEscape(s.source),
      csvEscape(dateCell(s.subscribedAt)),
      csvEscape(dateCell(s.unsubscribedAt)),
    ].join(','),
  )

  const csv = [header.join(','), ...rows].join('\r\n')

  const dateStamp = new Date().toISOString().slice(0, 10)
  const filename = `subscribers-${statusParam}-${dateStamp}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
