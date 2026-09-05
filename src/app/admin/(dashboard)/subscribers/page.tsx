import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import {
  SubscribersTable,
  type SubscriberRow,
} from '@/components/admin/subscribers/subscribers-table'

export const metadata = {
  title: 'Subscriber — Admin Peredam Mobil Jakarta',
  description: 'Kelola subscriber newsletter portal.',
  robots: { index: false, follow: false },
}

interface SearchParams {
  q?: string
  status?: string
}

export default async function SubscribersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()

  const sp = await searchParams
  const q = (sp.q ?? '').trim()
  const statusParam = (sp.status ?? 'all').toLowerCase()
  const allowedStatuses = ['all', 'active', 'unsubscribed']
  const statusFilter = allowedStatuses.includes(statusParam) ? statusParam : 'all'

  // Build where
  const where: { [k: string]: unknown } = {}
  if (q) where.email = { contains: q }
  if (statusFilter === 'active') where.status = 'ACTIVE'
  if (statusFilter === 'unsubscribed') where.status = 'UNSUBSCRIBED'

  const [subscribers, totalActive, totalUnsubscribed, totalMatching] = await Promise.all([
    db.subscriber.findMany({
      where,
      orderBy: [{ subscribedAt: 'desc' }],
      take: 500,
    }),
    db.subscriber.count({ where: { status: 'ACTIVE' } }),
    db.subscriber.count({ where: { status: 'UNSUBSCRIBED' } }),
    db.subscriber.count({ where }),
  ])

  const rows: SubscriberRow[] = subscribers.map((s) => ({
    id: s.id,
    email: s.email,
    status: s.status as 'ACTIVE' | 'UNSUBSCRIBED',
    source: s.source,
    subscribedAt: s.subscribedAt.toISOString(),
    unsubscribedAt: s.unsubscribedAt?.toISOString() ?? null,
  }))

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Subscriber Newsletter
          </h1>
          <p className="text-sm text-muted-foreground">
            Daftar subscriber buletin mingguan. Subscriber datang dari form
            newsletter di front-end portal — admin hanya mengelola daftar yang
            sudah ada.
          </p>
        </div>
      </div>

      {/* Quick info card */}
      <div className="flex items-start gap-3 rounded-lg border border-dashed bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-950/20">
        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="text-sm">
          <p className="font-medium text-foreground">
            Total {totalMatching} subscriber cocok dengan filter saat ini.
          </p>
          <p className="text-muted-foreground">
            Gunakan tombol "Unsubscribe" untuk berhenti berlangganan tanpa
            menghapus data. Hapus hanya jika ingin menghapus permanen.
          </p>
        </div>
      </div>

      <SubscribersTable
        rows={rows}
        totalActive={totalActive}
        totalUnsubscribed={totalUnsubscribed}
        initialQuery={q}
        initialStatus={statusFilter}
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
