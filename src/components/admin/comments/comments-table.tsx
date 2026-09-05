'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  Flag,
  Trash2,
  Search,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type CommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM'

export interface CommentRow {
  id: string
  articleId: string
  articleTitle: string
  articleSlug: string
  authorName: string
  authorEmail: string
  content: string
  status: CommentStatus
  parentId: string | null
  ipAddress: string | null
  createdAt: string
}

interface CommentsTableProps {
  rows: CommentRow[]
  total: number
  totalPending: number
  totalApproved: number
  totalRejected: number
  totalSpam: number
  currentStatus: string // 'all' | 'pending' | 'approved' | 'rejected' | 'spam'
  initialQuery: string
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const ID_DATE = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function fmtDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return ID_DATE.format(d)
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s
}

const STATUS_BADGE: Record<
  CommentStatus,
  { className: string; label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  PENDING: {
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    label: 'Pending',
    icon: AlertCircle,
  },
  APPROVED: {
    className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    label: 'Approved',
    icon: CheckCircle2,
  },
  REJECTED: {
    className: 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
    label: 'Rejected',
    icon: XCircle,
  },
  SPAM: {
    className: 'border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300',
    label: 'Spam',
    icon: Flag,
  },
}

const STATUS_TABS = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'spam', label: 'Spam' },
] as const

/* -------------------------------------------------------------------------- */
/*  Stat card                                                                 */
/* -------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  iconColor,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  iconColor: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
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
            {value.toLocaleString('id-ID')}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  Tabs (URL-synced)                                                          */
/* -------------------------------------------------------------------------- */

function StatusTabs({ value }: { value: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function change(next: string) {
    if (next === value) return
    const params = new URLSearchParams(searchParams.toString())
    if (next === 'all') {
      params.delete('status')
    } else {
      params.set('status', next)
    }
    // Reset page when filter changes
    params.delete('page')
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div
      role="tablist"
      aria-label="Filter status komentar"
      className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1"
    >
      {STATUS_TABS.map((tab) => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => change(tab.value)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Search bar (URL-synced)                                                    */
/* -------------------------------------------------------------------------- */

function SearchBar({ initialQuery }: { initialQuery: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(initialQuery)

  function change(v: string) {
    setValue(v)
    const params = new URLSearchParams(searchParams.toString())
    if (v.trim()) {
      params.set('q', v.trim())
    } else {
      params.delete('q')
    }
    params.delete('page')
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="relative w-full sm:w-80">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => change(e.target.value)}
        placeholder="Cari nama, email, atau isi komentar..."
        className="pl-9 pr-9"
        aria-label="Cari komentar"
      />
      {value && (
        <button
          type="button"
          onClick={() => change('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Hapus pencarian"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Per-row action buttons                                                     */
/* -------------------------------------------------------------------------- */

function RowActions({
  row,
  onAfterAction,
}: {
  row: CommentRow
  onAfterAction: () => void
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function moderate(status: CommentStatus) {
    if (busy) return
    if (row.status === status) {
      toast.message(`Komentar sudah berstatus ${status}.`)
      return
    }
    setBusy(status)
    try {
      const res = await fetch(`/api/admin/comments/${row.id}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast.error(data.message || 'Gagal mengubah status.')
        return
      }
      toast.success(`Komentar ${row.authorName}: ${status}.`)
      onAfterAction()
      router.refresh()
    } catch {
      toast.error('Kesalahan jaringan. Coba lagi.')
    } finally {
      setBusy(null)
    }
  }

  async function doDelete() {
    if (busy) return
    setBusy('delete')
    try {
      const res = await fetch(`/api/admin/comments/${row.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast.error(data.message || 'Gagal menghapus komentar.')
        setDeleteOpen(false)
        return
      }
      toast.success(`Komentar dari ${row.authorName} dihapus permanen.`)
      setDeleteOpen(false)
      onAfterAction()
      router.refresh()
    } catch {
      toast.error('Kesalahan jaringan. Coba lagi.')
    } finally {
      setBusy(null)
    }
  }

  const isLoading = busy !== null

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => moderate('APPROVED')}
        disabled={isLoading}
        title="Approve komentar"
        className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400"
      >
        {busy === 'APPROVED' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )
        }
        <span className="sr-only">Approve</span>
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => moderate('REJECTED')}
        disabled={isLoading}
        title="Reject komentar"
        className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-400"
      >
        {busy === 'REJECTED' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}
        <span className="sr-only">Reject</span>
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => moderate('SPAM')}
        disabled={isLoading}
        title="Tandai sebagai spam"
        className="h-8 w-8 p-0 text-slate-600 hover:bg-slate-500/10 hover:text-slate-700 dark:text-slate-400"
      >
        {busy === 'SPAM' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Flag className="h-4 w-4" />
        )}
        <span className="sr-only">Spam</span>
      </Button>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            disabled={isLoading}
            title="Hapus permanen"
            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
          >
            {busy === 'delete' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span className="sr-only">Hapus</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus komentar?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Komentar dari{' '}
              <strong>{row.authorName}</strong> akan dihapus permanen dari database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={doDelete}
              disabled={isLoading}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Ya, Hapus Permanen'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Bulk action confirm                                                        */
/* -------------------------------------------------------------------------- */

function BulkAction({
  selectedIds,
  action,
  onClear,
  trigger,
}: {
  selectedIds: string[]
  action: 'approve' | 'reject' | 'spam' | 'delete'
  onClear: () => void
  trigger: (open: boolean) => React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const count = selectedIds.length
  const verbByAction: Record<typeof action, string> = {
    approve: 'Approve',
    reject: 'Reject',
    spam: 'Tandai spam',
    delete: 'Hapus permanen',
  }
  const title = `${verbByAction[action]} ${count} komentar?`
  const desc =
    action === 'delete'
      ? 'Tindakan ini tidak dapat dibatalkan. Semua komentar yang dipilih akan dihapus permanen dari database.'
      : `Semua komentar yang dipilih akan ditandai sebagai ${
          action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'SPAM'
        }.`

  async function handle() {
    if (isPending) return
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/comments/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedIds, action }),
        })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          toast.error(data.message || 'Gagal eksekusi bulk action.')
          setOpen(false)
          return
        }
        toast.success(`${data.affected} komentar berhasil diproses (${verbByAction[action]}).`)
        setOpen(false)
        onClear()
        router.refresh()
      } catch {
        toast.error('Terjadi kesalahan jaringan. Coba lagi.')
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger(open)}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{desc}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handle}
            disabled={isPending}
            className={
              action === 'delete'
                ? 'bg-destructive text-white hover:bg-destructive/90'
                : action === 'reject'
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : action === 'approve'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : undefined
            }
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              `Ya, ${verbByAction[action]}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */

export function CommentsTable({
  rows,
  total,
  totalPending,
  totalApproved,
  totalRejected,
  totalSpam,
  currentStatus,
  initialQuery,
}: CommentsTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function clearSelection() {
    setSelected(new Set())
  }

  const allSelected = rows.length > 0 && selected.size === rows.length
  const someSelected = selected.size > 0 && !allSelected

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelected(new Set(rows.map((r) => r.id)))
    } else {
      setSelected(new Set())
    }
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const selectedIds = Array.from(selected)

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Komentar"
          value={total}
          icon={MessageSquare}
          gradient="bg-gradient-to-br from-amber-400 to-orange-600"
          iconColor="text-white"
        />
        <StatCard
          label="Pending"
          value={totalPending}
          icon={AlertCircle}
          gradient="bg-gradient-to-br from-amber-500 to-yellow-600"
          iconColor="text-white"
        />
        <StatCard
          label="Approved"
          value={totalApproved}
          icon={CheckCircle2}
          gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
          iconColor="text-white"
        />
        <StatCard
          label="Spam + Rejected"
          value={totalSpam + totalRejected}
          icon={Flag}
          gradient="bg-gradient-to-br from-slate-500 to-slate-700"
          iconColor="text-white"
        />
      </section>

      {/* Toolbar */}
      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Moderasi Komentar</CardTitle>
              <p className="text-sm text-muted-foreground">
                {rows.length} komentar ditampilkan dari total {total} · kelola status, hapus, atau
                tandai spam.
              </p>
            </div>
            <SearchBar initialQuery={initialQuery} />
          </div>
          <StatusTabs value={currentStatus} />
        </CardHeader>

        {/* Bulk action bar */}
        {selectedIds.length > 0 && (
          <div className="mx-6 mb-2 flex flex-col gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              <span className="font-medium">{selectedIds.length} dipilih.</span>{' '}
              <span className="text-muted-foreground">Pilih tindakan bulk di bawah.</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <BulkAction
                selectedIds={selectedIds}
                action="approve"
                onClear={clearSelection}
                trigger={(open) => (
                  <Button size="sm" variant="outline" disabled={open}>
                    <CheckCircle2 className="h-4 w-4" />
                    Approve Selected
                  </Button>
                )}
              />
              <BulkAction
                selectedIds={selectedIds}
                action="reject"
                onClear={clearSelection}
                trigger={(open) => (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-rose-500/40 text-rose-700 hover:bg-rose-500/10 dark:text-rose-300"
                    disabled={open}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Selected
                  </Button>
                )}
              />
              <BulkAction
                selectedIds={selectedIds}
                action="spam"
                onClear={clearSelection}
                trigger={(open) => (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-500/40 text-slate-700 hover:bg-slate-500/10 dark:text-slate-300"
                    disabled={open}
                  >
                    <Flag className="h-4 w-4" />
                    Spam Selected
                  </Button>
                )}
              />
              <BulkAction
                selectedIds={selectedIds}
                action="delete"
                onClear={clearSelection}
                trigger={(open) => (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10"
                    disabled={open}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Selected
                  </Button>
                )}
              />
              <Button size="sm" variant="ghost" onClick={clearSelection}>
                <X className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
        )}

        <CardContent className="px-0 pb-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <MessageSquare className="h-6 w-6 text-muted-foreground" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {initialQuery
                    ? 'Tidak ada komentar yang cocok.'
                    : currentStatus === 'all'
                      ? 'Belum ada komentar.'
                      : 'Tidak ada komentar dengan status ini.'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {initialQuery
                    ? 'Coba kata kunci lain atau ubah filter.'
                    : 'Komentar akan muncul di sini ketika pembaca mengirim komentar di artikel portal.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[44px] pl-6">
                      <Checkbox
                        checked={
                          allSelected ? true : someSelected ? 'indeterminate' : false
                        }
                        onCheckedChange={(c) => toggleAll(c === true)}
                        aria-label="Pilih semua komentar"
                      />
                    </TableHead>
                    <TableHead>Komentar</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[180px] pr-6 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((c) => {
                    const badge = STATUS_BADGE[c.status]
                    const Icon = badge.icon
                    return (
                      <TableRow
                        key={c.id}
                        data-state={selected.has(c.id) ? 'selected' : undefined}
                      >
                        <TableCell className="pl-6 align-top">
                          <Checkbox
                            checked={selected.has(c.id)}
                            onCheckedChange={(chk) => toggleOne(c.id, chk === true)}
                            aria-label={`Pilih komentar dari ${c.authorName}`}
                          />
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex max-w-[640px] flex-col gap-1">
                            <p className="line-clamp-3 text-sm text-foreground">
                              {c.content}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">
                                {c.authorName}
                              </span>
                              <span aria-hidden>·</span>
                              <a
                                href={`mailto:${c.authorEmail}`}
                                className="text-amber-700 hover:underline dark:text-amber-400"
                              >
                                {c.authorEmail}
                              </a>
                              <span aria-hidden>·</span>
                              <Link
                                href={`/admin/articles/${c.articleId}/edit`}
                                className="font-medium hover:underline"
                                title={c.articleTitle}
                              >
                                {truncate(c.articleTitle, 50)}
                              </Link>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                              <span>{fmtDate(c.createdAt)}</span>
                              {c.ipAddress && (
                                <>
                                  <span aria-hidden>·</span>
                                  <span className="tabular-nums">{c.ipAddress}</span>
                                </>
                              )}
                              {c.parentId && (
                                <>
                                  <span aria-hidden>·</span>
                                  <span className="italic">balasan</span>
                                </>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge className={cn('gap-1', badge.className)}>
                            <Icon className="h-3 w-3" />
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-6 align-top">
                          <RowActions row={c} onAfterAction={clearSelection} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
