'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  Mail,
  MailCheck,
  Trash2,
  Loader2,
  Download,
  MailX,
  Search,
  X,
  CheckCircle2,
  XCircle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

export interface SubscriberRow {
  id: string
  email: string
  status: 'ACTIVE' | 'UNSUBSCRIBED'
  source: string | null
  subscribedAt: string
  unsubscribedAt: string | null
}

interface SubscribersTableProps {
  rows: SubscriberRow[]
  totalActive: number
  totalUnsubscribed: number
  initialQuery: string
  initialStatus: string // 'all' | 'active' | 'unsubscribed'
}

/* -------------------------------------------------------------------------- */
/*  Date helpers                                                              */
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

/* -------------------------------------------------------------------------- */
/*  Search & filter bar (URL-synced)                                          */
/* -------------------------------------------------------------------------- */

function SubscriberSearchBar({
  initialQuery,
  statusValue,
  onStatusChange,
}: {
  initialQuery: string
  statusValue: string
  onStatusChange: (v: string) => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(initialQuery)

  function handleChange(v: string) {
    setValue(v)
    const params = new URLSearchParams(searchParams.toString())
    if (v.trim()) {
      params.set('q', v.trim())
    } else {
      params.delete('q')
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Cari email subscriber..."
          className="pl-9 pr-9"
          aria-label="Cari email subscriber"
        />
        {value && (
          <button
            type="button"
            onClick={() => handleChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Hapus pencarian"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Select value={statusValue} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full sm:w-44" aria-label="Filter status subscriber">
          <SelectValue placeholder="Filter status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Unsubscribe button                                                        */
/* -------------------------------------------------------------------------- */

function UnsubscribeButton({
  subscriberId,
  email,
  onDone: onDoneProp,
}: {
  subscriberId: string
  email: string
  onDone: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function handleUnsubscribe() {
    if (isPending) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/subscribers/${subscriberId}/unsubscribe`, {
          method: 'POST',
        })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          toast.error(data.message || 'Gagal unsubscribe.')
          return
        }
        toast.success(`Subscriber ${email} di-unsubscribe.`)
        onDoneProp()
        router.refresh()
      } catch (err) {
        console.error('[unsubscribe] error:', err)
        toast.error('Terjadi kesalahan jaringan. Coba lagi.')
      }
    })
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleUnsubscribe}
      disabled={isPending}
      title="Unsubscribe subscriber ini"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MailX className="h-4 w-4" />
      )}
      Unsubscribe
    </Button>
  )
}

/* -------------------------------------------------------------------------- */
/*  Delete button with confirm                                                */
/* -------------------------------------------------------------------------- */

function DeleteButton({
  subscriberId,
  email,
  onDone: onDoneProp,
}: {
  subscriberId: string
  email: string
  onDone: () => void
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleDelete() {
    if (isPending) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/subscribers/${subscriberId}`, {
          method: 'DELETE',
        })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          toast.error(data.message || 'Gagal menghapus subscriber.')
          setOpen(false)
          return
        }
        toast.success(`Subscriber ${email} dihapus permanen.`)
        setOpen(false)
        onDoneProp()
        router.refresh()
      } catch (err) {
        console.error('[subscriber-delete] error:', err)
        toast.error('Terjadi kesalahan jaringan. Coba lagi.')
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Hapus
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus subscriber?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini tidak dapat dibatalkan. Subscriber dengan email{' '}
            <strong>{email}</strong> akan dihapus permanen dari database.
            Untuk sekadar berhenti berlangganan, gunakan tombol "Unsubscribe".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isPending ? (
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
  )
}

/* -------------------------------------------------------------------------- */
/*  Bulk action confirm                                                       */
/* -------------------------------------------------------------------------- */

function BulkAction({
  selectedIds,
  action,
  onClear,
  trigger,
}: {
  selectedIds: string[]
  action: 'unsubscribe' | 'delete'
  onClear: () => void
  trigger: (open: boolean) => React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const count = selectedIds.length
  const title =
    action === 'unsubscribe'
      ? `Unsubscribe ${count} subscriber?`
      : `Hapus ${count} subscriber permanen?`
  const desc =
    action === 'unsubscribe'
      ? `Subscriber yang dipilih akan di-set menjadi UNSUBSCRIBED. Mereka tidak akan menerima buletin lagi, namun data tetap tersimpan.`
      : `Tindakan ini tidak dapat dibatalkan. Semua subscriber yang dipilih akan dihapus permanen dari database.`

  async function handleAction() {
    if (isPending) return
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/subscribers/bulk', {
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
        toast.success(
          action === 'unsubscribe'
            ? `${data.affected} subscriber di-unsubscribe.`
            : `${data.affected} subscriber dihapus permanen.`,
        )
        setOpen(false)
        onClear()
        router.refresh()
      } catch (err) {
        console.error('[subscriber-bulk] error:', err)
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
            onClick={handleAction}
            disabled={isPending}
            className={
              action === 'delete'
                ? 'bg-destructive text-white hover:bg-destructive/90'
                : undefined
            }
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : action === 'unsubscribe' ? (
              'Ya, Unsubscribe'
            ) : (
              'Ya, Hapus Permanen'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

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
/*  Main component                                                            */
/* -------------------------------------------------------------------------- */

export function SubscribersTable({
  rows,
  totalActive,
  totalUnsubscribed,
  initialQuery,
  initialStatus,
}: SubscribersTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [statusValue, setStatusValue] = useState(initialStatus)

  function onStatusChange(v: string) {
    setStatusValue(v)
    const params = new URLSearchParams(searchParams.toString())
    if (v === 'all') {
      params.delete('status')
    } else {
      params.set('status', v)
    }
    router.replace(`${pathname}?${params.toString()}`)
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
      if (checked) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }

  function clearSelection() {
    setSelected(new Set())
  }

  const selectedIds = Array.from(selected)
  const activeSelected = rows.filter(
    (r) => selected.has(r.id) && r.status === 'ACTIVE',
  ).length

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Total Active"
          value={totalActive}
          icon={MailCheck}
          gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
          iconColor="text-white"
        />
        <StatCard
          label="Total Unsubscribed"
          value={totalUnsubscribed}
          icon={MailX}
          gradient="bg-gradient-to-br from-slate-500 to-slate-700"
          iconColor="text-white"
        />
      </section>

      {/* Toolbar */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Daftar Subscriber</CardTitle>
            <p className="text-sm text-muted-foreground">
              {rows.length} subscriber ditampilkan ·{' '}
              <a
                href="/api/admin/subscribers/export?status=active"
                className="font-medium text-amber-600 hover:underline dark:text-amber-400"
              >
                Export Active CSV
              </a>
              {' · '}
              <a
                href="/api/admin/subscribers/export?status=all"
                className="font-medium text-amber-600 hover:underline dark:text-amber-400"
              >
                Export Semua
              </a>
            </p>
          </div>
          <SubscriberSearchBar
            initialQuery={initialQuery}
            statusValue={statusValue}
            onStatusChange={onStatusChange}
          />
        </CardHeader>

        {/* Bulk action bar */}
        {selectedIds.length > 0 && (
          <div className="mx-6 mb-2 flex flex-col gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              <span className="font-medium">{selectedIds.length} dipilih.</span>{' '}
              <span className="text-muted-foreground">
                {activeSelected} active · {selectedIds.length - activeSelected} unsubscribed
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <BulkAction
                selectedIds={selectedIds}
                action="unsubscribe"
                onClear={clearSelection}
                trigger={(open) => (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={open || activeSelected === 0}
                    title={
                      activeSelected === 0
                        ? 'Tidak ada subscriber aktif yang dipilih'
                        : 'Unsubscribe subscriber yang dipilih'
                    }
                  >
                    <MailX className="h-4 w-4" />
                    Unsubscribe Selected
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
                    Hapus Selected
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
                <Mail className="h-6 w-6 text-muted-foreground" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {initialQuery
                    ? 'Tidak ada subscriber yang cocok.'
                    : 'Belum ada subscriber.'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {initialQuery
                    ? 'Coba kata kunci lain atau ubah filter.'
                    : 'Subscriber akan terisi otomatis ketika pembaca subscribe via form newsletter di front-end.'}
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
                          allSelected
                            ? true
                            : someSelected
                              ? 'indeterminate'
                              : false
                        }
                        onCheckedChange={(c) => toggleAll(c === true)}
                        aria-label="Pilih semua subscriber"
                      />
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-[140px]">Status</TableHead>
                    <TableHead className="w-[120px]">Source</TableHead>
                    <TableHead className="w-[180px]">Subscribed At</TableHead>
                    <TableHead className="w-[220px] pr-6 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((s) => (
                    <TableRow
                      key={s.id}
                      data-state={selected.has(s.id) ? 'selected' : undefined}
                    >
                      <TableCell className="pl-6">
                        <Checkbox
                          checked={selected.has(s.id)}
                          onCheckedChange={(c) => toggleOne(s.id, c === true)}
                          aria-label={`Pilih ${s.email}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {s.email}
                      </TableCell>
                      <TableCell>
                        {s.status === 'ACTIVE' ? (
                          <Badge className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="gap-1 border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300"
                          >
                            <XCircle className="h-3 w-3" />
                            Unsubscribed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.source || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        {fmtDate(s.subscribedAt)}
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="flex justify-end gap-1">
                          {s.status === 'ACTIVE' && (
                            <UnsubscribeButton
                              subscriberId={s.id}
                              email={s.email}
                              onDone={clearSelection}
                            />
                          )}
                          <DeleteButton
                            subscriberId={s.id}
                            email={s.email}
                            onDone={clearSelection}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export buttons (mobile-friendly) */}
      <div className="flex flex-wrap justify-end gap-2">
        <Button asChild size="sm" variant="outline">
          <a href="/api/admin/subscribers/export?status=active">
            <Download className="h-4 w-4" />
            Export Active CSV
          </a>
        </Button>
        <Button asChild size="sm" variant="outline">
          <a href="/api/admin/subscribers/export?status=all">
            <Download className="h-4 w-4" />
            Export Semua
          </a>
        </Button>
      </div>
    </div>
  )
}
