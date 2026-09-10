import Link from 'next/link'
import {
  ArrowUpRight,
  Eye,
  FileText,
  HelpCircle,
  Mail,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  Archive,
  MessageSquare,
} from 'lucide-react'

import { db } from '@/lib/db'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  CategoryViewsPie,
  MonthlyArticlesChart,
  type CategorySlice,
  type MonthlyPoint,
} from './charts'

export const metadata = {
  title: 'Overview — Admin Peredam Mobil Jakarta',
  description: 'Ringkasan statistik & aktivitas portal.',
  robots: { index: false, follow: false },
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const ID_DATE = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})
const ID_DATE_SHORT = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
})

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return ID_DATE.format(d)
}

function fmtRelative(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const diff = Date.now() - d.getTime()
  const day = 24 * 60 * 60 * 1000
  if (diff < day) return 'Hari ini'
  if (diff < 2 * day) return 'Kemarin'
  if (diff < 7 * day) return `${Math.floor(diff / day)} hari lalu`
  return ID_DATE_SHORT.format(d)
}

function statusVariant(
  status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'PUBLISHED':
      return 'default'
    case 'DRAFT':
      return 'secondary'
    case 'ARCHIVED':
      return 'outline'
    default:
      return 'outline'
  }
}

/* -------------------------------------------------------------------------- */
/*  Stat cards (server-rendered)                                              */
/* -------------------------------------------------------------------------- */

interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string // tailwind gradient classes
  iconColor: string
  href?: string
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  gradient,
  iconColor,
  href,
}: StatCardProps) {
  const inner = (
    <>
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl shadow-sm',
          gradient,
        )}
        aria-hidden
      >
        <Icon className={cn('h-5 w-5', iconColor)} />
      </div>
      <div className="flex flex-1 flex-col">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="text-2xl font-bold leading-tight text-foreground tabular-nums">
          {value}
        </span>
        {hint && (
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        )}
      </div>
      {href && (
        <ArrowUpRight
          className="h-4 w-4 shrink-0 text-muted-foreground/60"
          aria-hidden
        />
      )}
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="group flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        {inner}
      </Link>
    )
  }
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
      {inner}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Quick actions                                                             */
/* -------------------------------------------------------------------------- */

function QuickActions() {
  return (
    <Card className="border-dashed bg-gradient-to-br from-amber-50 via-orange-50 to-background dark:from-amber-950/20 dark:via-orange-950/20">
      <CardHeader>
        <CardTitle className="text-base">Aksi Cepat</CardTitle>
        <CardDescription>Mulai tugas harian dengan satu klik.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button asChild className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700">
          <Link href="/admin/articles/new">
            <Plus className="h-4 w-4" />
            Artikel Baru
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/faq">
            <HelpCircle className="h-4 w-4" />
            Kelola FAQ
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/comments">
            <MessageSquare className="h-4 w-4" />
            Moderasi Komentar
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  Tables                                                                     */
/* -------------------------------------------------------------------------- */

interface ArticleRow {
  id: string
  title: string
  status: string
  categoryName: string
  createdAt: string
  viewCount: number
  publishedAt: string | null
}

function RecentArticlesTable({ rows }: { rows: ArticleRow[] }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="text-base">Artikel Terbaru</CardTitle>
          <CardDescription>5 artikel terakhir dibuat.</CardDescription>
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link href="/admin/articles">
            Lihat semua
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1">
        {rows.length === 0 ? (
          <EmptyState
            label="Belum ada artikel."
            hint="Mulai dengan menambahkan artikel pertama Anda."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead className="w-[110px]">Status</TableHead>
                <TableHead className="w-[110px] text-right">Dibuat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="max-w-[260px]">
                    <Link
                      href={`/admin/articles/${a.id}/edit`}
                      className="block truncate font-medium text-foreground hover:text-amber-600 hover:underline"
                    >
                      {a.title}
                    </Link>
                    <span className="text-[11px] text-muted-foreground">
                      {a.categoryName}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                    {fmtRelative(a.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function TopArticlesTable({ rows }: { rows: ArticleRow[] }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="text-base">Paling Banyak Dibaca</CardTitle>
          <CardDescription>Top 5 artikel berdasarkan views.</CardDescription>
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link href="/admin/articles">
            Lihat semua
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1">
        {rows.length === 0 ? (
          <EmptyState
            label="Belum ada data views."
            hint="Views akan terkumpul otomatis saat artikel dibaca pembaca."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">#</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead className="w-[110px] text-right">Views</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a, i) => (
                <TableRow key={a.id}>
                  <TableCell className="font-bold text-amber-500 tabular-nums">
                    {i + 1}
                  </TableCell>
                  <TableCell className="max-w-[220px]">
                    <Link
                      href={`/admin/articles/${a.id}/edit`}
                      className="block truncate font-medium text-foreground hover:text-amber-600 hover:underline"
                    >
                      {a.title}
                    </Link>
                    <span className="text-[11px] text-muted-foreground">
                      {a.categoryName} · {fmtDate(a.publishedAt)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1 font-medium tabular-nums">
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      {a.viewCount.toLocaleString('id-ID')}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function EmptyState({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-1 py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <FileText className="h-5 w-5 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Page (server)                                                              */
/* -------------------------------------------------------------------------- */

export default async function OverviewPage() {
  // Aggregate stats in parallel — wrapped in try/catch to prevent 500 crash
  // if any DB query fails (Supabase cold start, RLS edge case, etc.)
  let totalArticles = 0
  let publishedArticles = 0
  let draftArticles = 0
  let archivedArticles = 0
  let totalViewsAgg: { _sum: { viewCount?: number } } = { _sum: {} }
  let activeSubscribers = 0
  let pendingComments = 0
  let recentArticles: any[] = []
  let topArticles: any[] = []
  let allArticlesForChart: any[] = []
  let categoriesWithArticles: any[] = []
  
  try {
    ;([
      totalArticles,
      publishedArticles,
      draftArticles,
      archivedArticles,
      totalViewsAgg,
      activeSubscribers,
      pendingComments,
      recentArticles,
      topArticles,
      allArticlesForChart,
      categoriesWithArticles,
    ] = await Promise.all([
      db.article.count(),
      db.article.count({ where: { status: 'PUBLISHED' } }),
      db.article.count({ where: { status: 'DRAFT' } }),
      db.article.count({ where: { status: 'ARCHIVED' } }),
      db.article.aggregate({ _sum: { viewCount: true } }),
      db.subscriber.count({ where: { status: 'ACTIVE' } }),
      db.comment.count({ where: { status: 'PENDING' } }),
      db.article.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { category: { select: { name: true } } },
      }),
      db.article.findMany({
        orderBy: { viewCount: 'desc' },
        take: 5,
        include: { category: { select: { name: true } } },
      }),
      db.article.findMany({
        where: {
          OR: [
            { publishedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1) } },
            { publishedAt: null, createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1) } },
          ],
        },
        select: { publishedAt: true, createdAt: true },
      }),
      db.category.findMany({
        orderBy: { order: 'asc' },
        include: { articles: { select: { viewCount: true } } },
      }),
    ] as any[]))
  } catch (err) {
    console.error('[admin/overview] DB query failed:', err)
    // Fallback: render page with zeros & empty arrays
  }

  const totalViews = totalViewsAgg._sum.viewCount ?? 0

  // Build last 12 months buckets (id-ID short month labels)
  const now = new Date()
  const monthlyMap = new Map<string, MonthlyPoint>()
  const monthlyData: MonthlyPoint[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('id-ID', { month: 'short' })
    const point: MonthlyPoint = { month: label, count: 0 }
    monthlyMap.set(key, point)
    monthlyData.push(point)
  }
  for (const a of allArticlesForChart) {
    const d = a.publishedAt ?? a.createdAt
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const point = monthlyMap.get(key)
    if (point) point.count += 1
  }

  // Views per category (sum viewCount of its articles)
  const categoryViews: CategorySlice[] = (categoriesWithArticles || [])
    .map((c: any) => ({
      name: c.name,
      views: (c.articles || []).reduce((sum: number, a: any) => sum + (a.viewCount || 0), 0),
    }))
    .filter((c) => c.views > 0)
    .sort((a, b) => b.views - a.views)

  // Serialize articles for client tables (we keep them as plain objects)
  const recentRows: ArticleRow[] = (recentArticles || []).map((a: any) => ({
    id: a.id,
    title: a.title,
    status: a.status,
    categoryName: a.category?.name ?? '—',
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : (a.createdAt ?? new Date().toISOString()),
    viewCount: a.viewCount ?? 0,
    publishedAt: a.publishedAt instanceof Date ? a.publishedAt.toISOString() : (a.publishedAt ?? null),
  }))

  const topRows: ArticleRow[] = (topArticles || []).map((a: any) => ({
    id: a.id,
    title: a.title,
    status: a.status,
    categoryName: a.category?.name ?? '—',
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : (a.createdAt ?? new Date().toISOString()),
    viewCount: a.viewCount ?? 0,
    publishedAt: a.publishedAt instanceof Date ? a.publishedAt.toISOString() : (a.publishedAt ?? null),
  }))

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      {/* Page heading */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Overview Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan statistik & aktivitas portal Peredam Mobil Jakarta.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Diperbarui {ID_DATE.format(now)}
        </div>
      </div>

      {/* Stat cards */}
      <section
        aria-label="Statistik utama"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          label="Total Artikel"
          value={totalArticles}
          hint={`${draftArticles} draft · ${archivedArticles} arsip`}
          icon={FileText}
          gradient="bg-gradient-to-br from-amber-400 to-orange-500"
          iconColor="text-white"
          href="/admin/articles"
        />
        <StatCard
          label="Published"
          value={publishedArticles}
          hint="Artikel aktif yang sudah publish"
          icon={CheckCircle2}
          gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
          iconColor="text-white"
          href="/admin/articles"
        />
        <StatCard
          label="Total Views"
          value={totalViews.toLocaleString('id-ID')}
          hint="Akumulasi semua artikel"
          icon={Eye}
          gradient="bg-gradient-to-br from-slate-700 to-slate-900"
          iconColor="text-amber-300"
        />
        <StatCard
          label="Subscribers"
          value={activeSubscribers}
          hint={`${pendingComments} komentar perlu moderasi`}
          icon={Mail}
          gradient="bg-gradient-to-br from-orange-500 to-rose-600"
          iconColor="text-white"
          href="/admin/subscribers"
        />
      </section>

      {/* Charts row */}
      <section
        aria-label="Grafik"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Artikel Dipublikasi per Bulan</CardTitle>
            <CardDescription>12 bulan terakhir.</CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyArticlesChart data={monthlyData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Views per Kategori</CardTitle>
            <CardDescription>Distribusi views artikel.</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryViewsPie data={categoryViews} />
          </CardContent>
        </Card>
      </section>

      {/* Quick actions */}
      <QuickActions />

      {/* Tables row */}
      <section
        aria-label="Tabel artikel"
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <RecentArticlesTable rows={recentRows} />
        <TopArticlesTable rows={topRows} />
      </section>

      {/* Footer mini-stats */}
      <section className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <MiniStat
          icon={FileText}
          label="Drafts"
          value={draftArticles}
          color="text-slate-500"
        />
        <MiniStat
          icon={Archive}
          label="Arsip"
          value={archivedArticles}
          color="text-slate-500"
        />
        <MiniStat
          icon={MessageSquare}
          label="Komentar Pending"
          value={pendingComments}
          color="text-amber-600"
          href="/admin/comments"
        />
        <MiniStat
          icon={Send}
          label="Subscriber Aktif"
          value={activeSubscribers}
          color="text-emerald-600"
          href="/admin/subscribers"
        />
      </section>
    </div>
  )
}

function MiniStat({
  icon: Icon,
  label,
  value,
  color,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  color: string
  href?: string
}) {
  const content = (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 shadow-sm transition-colors hover:bg-muted/40">
      <Icon className={cn('h-4 w-4', color)} aria-hidden />
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="font-semibold text-foreground tabular-nums">
          {value.toLocaleString('id-ID')}
        </span>
      </div>
    </div>
  )
  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }
  return content
}
