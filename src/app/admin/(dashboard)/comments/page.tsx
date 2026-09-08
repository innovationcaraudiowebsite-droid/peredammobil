import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import {
  CommentsTable,
  type CommentRow,
  type CommentStatus,
} from '@/components/admin/comments/comments-table'

export const metadata = {
  title: 'Komentar — Admin Peredam Mobil Jakarta',
  description: 'Moderasi komentar pembaca portal.',
  robots: { index: false, follow: false },
}

const VALID_STATUSES = new Set(['all', 'pending', 'approved', 'rejected', 'spam'])

interface SearchParams {
  status?: string
  q?: string
}

export default async function CommentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()

  const sp = await searchParams
  const rawStatus = (sp.status ?? 'all').toLowerCase()
  const currentStatus = VALID_STATUSES.has(rawStatus) ? rawStatus : 'all'
  const q = (sp.q ?? '').trim()

  // Build where
  const where: { [k: string]: unknown } = {}
  if (currentStatus !== 'all') {
    where.status = currentStatus.toUpperCase()
  }
  if (q) {
    where.OR = [
      { authorName: { contains: q } },
      { authorEmail: { contains: q } },
      { content: { contains: q } },
    ]
  }

  const [items, total, totalPending, totalApproved, totalRejected, totalSpam] =
    await Promise.all([
      db.comment.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 200,
        include: {
          article: {
            select: { id: true, title: true, slug: true },
          },
        },
      }),
      db.comment.count({ where }),
      db.comment.count({ where: { status: 'PENDING' } }),
      db.comment.count({ where: { status: 'APPROVED' } }),
      db.comment.count({ where: { status: 'REJECTED' } }),
      db.comment.count({ where: { status: 'SPAM' } }),
    ])

  const rows: CommentRow[] = items.map((c) => ({
    id: c.id,
    articleId: c.articleId,
    articleTitle: c.article.title,
    articleSlug: c.article.slug,
    authorName: c.authorName,
    authorEmail: c.authorEmail,
    content: c.content,
    status: c.status as CommentStatus,
    parentId: c.parentId,
    ipAddress: c.ipAddress,
    createdAt: c.createdAt.toISOString(),
  }))

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Moderasi Komentar
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola komentar pembaca — approve, reject, tandai spam, atau hapus permanen.
          </p>
        </div>
      </div>

      <CommentsTable
        rows={rows}
        total={total}
        totalPending={totalPending}
        totalApproved={totalApproved}
        totalRejected={totalRejected}
        totalSpam={totalSpam}
        currentStatus={currentStatus}
        initialQuery={q}
      />

      <div className="flex justify-start">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard
          </Link>
        </Button>
      </div>

      <SonnerToaster richColors position="top-right" />
    </div>
  )
}
