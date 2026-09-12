import { NextRequest, NextResponse } from 'next/server'

import { requireAdminApi } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

const VALID_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'SPAM'] as const
const PAGE_SIZE = 25

/**
 * GET /api/admin/comments?status=PENDING|APPROVED|REJECTED|SPAM&page=1&q=...
 * List komentar dengan filter status, search author/email/content, & paginasi.
 */
export async function GET(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const statusParam = (url.searchParams.get('status') ?? 'all').toUpperCase()
  const q = (url.searchParams.get('q') ?? '').trim()
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1)

  const where: { [k: string]: unknown } = {}
  if (
    statusParam !== 'ALL' &&
    VALID_STATUSES.includes(statusParam as (typeof VALID_STATUSES)[number])
  ) {
    where.status = statusParam
  }
  if (q) {
    where.OR = [
      { authorName: { contains: q } },
      { authorEmail: { contains: q } },
      { content: { contains: q } },
    ]
  }

  const [total, items] = await Promise.all([
    db.comment.count({ where }),
    db.comment.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        article: {
          select: { id: true, title: true, slug: true },
        },
      },
    }),
  ])

  return NextResponse.json({
    ok: true,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    items: items.map((c) => ({
      id: c.id,
      articleId: c.articleId,
      articleTitle: c.article.title,
      articleSlug: c.article.slug,
      authorName: c.authorName,
      authorEmail: c.authorEmail,
      content: c.content,
      status: c.status,
      parentId: c.parentId,
      ipAddress: c.ipAddress,
      createdAt: c.createdAt.toISOString(),
    })),
  })
}
