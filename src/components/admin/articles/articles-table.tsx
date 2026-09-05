'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  ArrowDownAZ,
  ArrowUpDown,
  ArrowUpAZ,
  CheckCircle2,
  Edit3,
  Eye,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Star,
  StarOff,
  Trash2,
  Archive,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface ArticleListItem {
  id: string
  title: string
  slug: string
  status: string
  viewCount: number
  authorName: string
  publishedAt: string | null
  createdAt: string
  isFeatured: boolean
  isBreaking: boolean
  category: {
    id: string
    name: string
    slug: string
    color: string | null
  }
}

interface ArticlesTableProps {
  items: ArticleListItem[]
  total: number
  page: number
  pageSize: number
  q: string
  categoryFilter: string
  statusFilter: string
  sort: string
  categories: { id: string; name: string; slug: string; color: string | null }[]
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const ID_DATE = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return ID_DATE.format(d)
}

function fmtViews(n: number): string {
  return n.toLocaleString('id-ID')
}

/** Map kategori color key → Tailwind badge style. */
function categoryBadgeClass(color: string | null | undefined): string {
  switch (color) {
    case 'amber':
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-800'
    case 'red':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800'
    case 'emerald':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-800'
    case 'slate':
      return 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-700/60 dark:text-slate-100 dark:border-slate-600'
    default:
      return 'bg-muted text-foreground border-border'
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'PUBLISHED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-800'
    case 'DRAFT':
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-700'
    case 'ARCHIVED':
      return 'bg-zinc-200 text-zinc-700 border-zinc-300 dark:bg-zinc-800/60 dark:text-zinc-300 dark:border-zinc-700'
    default:
      return 'bg-muted text-foreground border-border'
  }
}

/* -------------------------------------------------------------------------- */
/*  Filter Bar                                                                 */
/* -------------------------------------------------------------------------- */

function FilterBar({
  q,
  categoryFilter,
  statusFilter,
  sort,
  categories,
}: {
  q: string
  categoryFilter: string
  statusFilter: string
  sort: string
  categories: { id: string; name: string; slug: string; color: string | null }[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  // Local input state untuk search, push ke URL saat submit / debounce.
  const [searchInput, setSearchInput] = useState(q)

  function pushParams(next: Record<string, string>) {
    const params = new URLSearchParams(sp.toString())
    // Reset ke page 1 setiap kali filter berubah
    if (
      'q' in next ||
      'category' in next ||
      'status' in next ||
      'sort' in next
    ) {
      params.delete('page')
    }
    for (const [k, v] of Object.entries(next)) {
      if (v === '' || v === 'all') params.delete(k)
      else params.set(k, v)
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') pushParams({ q: searchInput })
          }}
          onBlur={() => pushParams({ q: searchInput })}
          placeholder="Cari judul artikel..."
          className="pl-8"
          aria-label="Cari artikel"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Select
          value={categoryFilter || 'all'}
          onValueChange={(v) => pushParams({ category: v })}
        >
          <SelectTrigger className="w-[160px]" aria-label="Filter kategori">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter || 'all'}
          onValueChange={(v) => pushParams({ status: v })}
        >
          <SelectTrigger className="w-[140px]" aria-label="Filter status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => pushParams({ sort: v })}>
          <SelectTrigger className="w-[160px]" aria-label="Urutkan">
            <SelectValue placeholder="Urutkan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Terbaru</SelectItem>
            <SelectItem value="oldest">Terlama</SelectItem>
            <SelectItem value="popular">Populer (views)</SelectItem>
            <SelectItem value="title-asc">Judul A-Z</SelectItem>
          </SelectContent>
        </Select>
        <Button asChild className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700">
          <Link href="/admin/articles/new">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Artikel Baru</span>
          </Link>
        </Button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Row Action Menu                                                            */
/* -------------------------------------------------------------------------- */

function RowActions({ row }: { row: ArticleListItem }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function toggleFeatured() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/articles/${row.id}/toggle-featured`, {
          method: 'POST',
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.message || 'Gagal toggle featured')
        }
        const data = (await res.json()) as { ok: boolean; isFeatured?: boolean; warning?: string }
        if (data.warning) {
          toast.info('Featured diaktifkan', { description: data.warning })
        } else {
          toast.success(
            data.isFeatured ? 'Ditandai sebagai featured' : 'Featured dimatikan',
          )
        }
        router.refresh()
      } catch (e) {
        toast.error('Gagal mengubah featured', {
          description: e instanceof Error ? e.message : undefined,
        })
      }
    })
  }

  function archive() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/articles/${row.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ARCHIVED' }),
        })
        if (!res.ok) throw new Error('Gagal mengarsipkan')
        toast.success('Artikel diarsipkan')
        router.refresh()
      } catch (e) {
        toast.error('Gagal mengarsipkan', {
          description: e instanceof Error ? e.message : undefined,
        })
      }
    })
  }

  function doDelete() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/articles/${row.id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Gagal menghapus')
        toast.success('Artikel dihapus')
        setConfirmDelete(false)
        router.refresh()
      } catch (e) {
        toast.error('Gagal menghapus', {
          description: e instanceof Error ? e.message : undefined,
        })
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Aksi"
            disabled={pending}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/admin/articles/${row.id}/edit`}>
              <Edit3 className="h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/admin/articles/${row.id}/preview`} target="_blank">
              <Eye className="h-4 w-4" />
              Preview
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={toggleFeatured}>
            {row.isFeatured ? (
              <>
                <StarOff className="h-4 w-4" />
                Lepas Featured
              </>
            ) : (
              <>
                <Star className="h-4 w-4" />
                Jadikan Featured
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={archive}>
            <Archive className="h-4 w-4" />
            Arsipkan
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus artikel?</AlertDialogTitle>
            <AlertDialogDescription>
              Artikel <strong>&ldquo;{row.title}&rdquo;</strong> akan dihapus permanen
              beserta semua versi, komentar, dan relasi tag. Aksi ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={doDelete}
              disabled={pending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Ya, hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*  Bulk Action Bar                                                            */
/* -------------------------------------------------------------------------- */

function BulkBar({
  selectedIds,
  onClear,
  onDone,
}: {
  selectedIds: Set<string>
  onClear: () => void
  onDone: () => void
}) {
  const [pending, startTransition] = useTransition()
  const count = selectedIds.size
  const [confirm, setConfirm] = useState<null | 'publish' | 'archive' | 'delete'>(null)
  const router = useRouter()

  if (count === 0) return null

  function run(action: 'publish' | 'archive' | 'delete') {
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/articles/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ids: Array.from(selectedIds),
            action,
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.message || 'Gagal bulk action')
        }
        const data = (await res.json()) as { ok: boolean; affected?: number }
        const label =
          action === 'publish'
            ? 'dipublikasikan'
            : action === 'archive'
              ? 'diarsipkan'
              : 'dihapus'
        toast.success(`${data.affected ?? count} artikel ${label}`)
        setConfirm(null)
        onClear()
        onDone()
      } catch (e) {
        toast.error('Bulk action gagal', {
          description: e instanceof Error ? e.message : undefined,
        })
      }
    })
  }

  return (
    <>
      <div className="sticky bottom-3 z-20 mx-auto flex max-w-fit items-center gap-2 rounded-full border bg-card/95 px-3 py-2 shadow-lg backdrop-blur">
        <span className="px-2 text-sm font-medium">
          {count} artikel dipilih
        </span>
        <Button
          size="sm"
          onClick={() => setConfirm('publish')}
          disabled={pending}
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <CheckCircle2 className="h-4 w-4" />
          Publish
        </Button>
        <Button size="sm" variant="outline" onClick={() => setConfirm('archive')} disabled={pending}>
          <Archive className="h-4 w-4" />
          Arsipkan
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setConfirm('delete')}
          disabled={pending}
        >
          <Trash2 className="h-4 w-4" />
          Hapus
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear} disabled={pending} aria-label="Bersihkan seleksi">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <AlertDialog open={confirm !== null} onOpenChange={() => setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === 'delete'
                ? `Hapus ${count} artikel?`
                : confirm === 'archive'
                  ? `Arsipkan ${count} artikel?`
                  : `Publish ${count} artikel?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === 'delete'
                ? 'Artikel yang dipilih akan dihapus permanen beserta versi, komentar, dan relasi.'
                : confirm === 'archive'
                  ? 'Artikel yang dipilih akan disembunyikan dari front-end (status menjadi ARCHIVED).'
                  : 'Artikel yang dipilih akan dipublikasikan. publishedAt di-set ke sekarang bila belum ada.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={() => confirm && run(confirm)}
              className={cn(
                confirm === 'delete' &&
                  'bg-destructive text-white hover:bg-destructive/90',
              )}
            >
              Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*  Pagination                                                                 */
/* -------------------------------------------------------------------------- */

function PaginationBar({
  total,
  page,
  pageSize,
}: {
  total: number
  page: number
  pageSize: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  function goTo(p: number) {
    const params = new URLSearchParams(sp.toString())
    if (p <= 1) params.delete('page')
    else params.set('page', String(p))
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // Build simple pagination: 1 ... current-1, current, current+1 ... last
  const pages: (number | '...')[] = []
  const add = (p: number) => pages.push(p)
  const addEllipsis = () => pages.push('...')
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) add(i)
  } else {
    add(1)
    if (page > 3) addEllipsis()
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) add(i)
    if (page < totalPages - 2) addEllipsis()
    add(totalPages)
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-2 pt-4"
    >
      <p className="text-xs text-muted-foreground">
        Halaman {page} dari {totalPages} &middot; {total.toLocaleString('id-ID')} artikel
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => goTo(page - 1)}
        >
          Sebelumnya
        </Button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="px-2 text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="icon"
              className="h-8 w-8"
              onClick={() => goTo(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => goTo(page + 1)}
        >
          Berikutnya
        </Button>
      </div>
    </nav>
  )
}

/* -------------------------------------------------------------------------- */
/*  Empty State                                                                */
/* -------------------------------------------------------------------------- */

function EmptyState({ q }: { q: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <FileText className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-base font-medium">
        {q ? 'Tidak ada artikel yang cocok.' : 'Belum ada artikel.'}
      </p>
      <p className="text-sm text-muted-foreground">
        {q
          ? 'Coba ubah kata kunci pencarian atau filter.'
          : 'Mulai dengan menambahkan artikel pertama Anda.'}
      </p>
      <Button asChild className="mt-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700">
        <Link href="/admin/articles/new">
          <Plus className="h-4 w-4" />
          Artikel Baru
        </Link>
      </Button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main                                                                       */
/* -------------------------------------------------------------------------- */

export function ArticlesTable({
  items,
  total,
  page,
  pageSize,
  q,
  categoryFilter,
  statusFilter,
  sort,
  categories,
}: ArticlesTableProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Reset selection bila filter berubah — pakai derived-state pattern
  // (call setState during render with condition) supaya tidak trigger lint
  // effect-cascade warning.
  const filterKey = `${page}|${q}|${categoryFilter}|${statusFilter}|${sort}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey)
    setSelected(new Set())
  }

  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id))
  const someSelected = items.some((i) => selected.has(i.id))

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        items.forEach((i) => next.delete(i.id))
      } else {
        items.forEach((i) => next.add(i.id))
      }
      return next
    })
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-3">
      <FilterBar
        q={q}
        categoryFilter={categoryFilter}
        statusFilter={statusFilter}
        sort={sort}
        categories={categories}
      />

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allSelected || (someSelected && 'indeterminate')}
                  onCheckedChange={toggleAll}
                  aria-label="Pilih semua artikel di halaman ini"
                />
              </TableHead>
              <TableHead className="min-w-[280px]">Judul</TableHead>
              <TableHead className="w-[140px]">Kategori</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[90px] text-right">Views</TableHead>
              <TableHead className="w-[140px]">Penulis</TableHead>
              <TableHead className="w-[110px]">Tgl</TableHead>
              <TableHead className="w-[60px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="p-0">
                  <EmptyState q={q} />
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <TableRow key={row.id} data-state={selected.has(row.id) ? 'selected' : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(row.id)}
                      onCheckedChange={() => toggleOne(row.id)}
                      aria-label={`Pilih ${row.title}`}
                    />
                  </TableCell>
                  <TableCell className="max-w-[420px]">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/admin/articles/${row.id}/edit`}
                        className="line-clamp-2 font-medium text-foreground hover:text-amber-600 hover:underline"
                      >
                        {row.title}
                      </Link>
                      <div className="flex items-center gap-1.5">
                        {row.isFeatured && (
                          <Badge
                            variant="outline"
                            className="border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700"
                          >
                            <Star className="h-3 w-3" />
                            Featured
                          </Badge>
                        )}
                        {row.isBreaking && (
                          <Badge
                            variant="outline"
                            className="border-red-300 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700"
                          >
                            <Sparkles className="h-3 w-3" />
                            Breaking
                          </Badge>
                        )}
                        <span className="truncate text-[11px] text-muted-foreground">
                          /{row.slug}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn('whitespace-nowrap', categoryBadgeClass(row.category.color))}
                    >
                      {row.category.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn('whitespace-nowrap', statusBadgeClass(row.status))}
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fmtViews(row.viewCount)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.authorName}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {fmtDate(row.publishedAt ?? row.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions row={row} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <BulkBar
        selectedIds={selected}
        onClear={() => setSelected(new Set())}
        onDone={() => router.refresh()}
      />

      <PaginationBar total={total} page={page} pageSize={pageSize} />
    </div>
  )
}
