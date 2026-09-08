import Link from 'next/link'
import { Plus, FolderTree, ArrowLeft } from 'lucide-react'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
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
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import {
  CategoryDialog,
  type CategoryRow,
} from '@/components/admin/categories/category-dialog'
import { CategoryDeleteButton } from '@/components/admin/categories/category-delete-button'

export const metadata = {
  title: 'Kategori — Admin Peredam Mobil Jakarta',
  description: 'Kelola kategori artikel portal.',
  robots: { index: false, follow: false },
}

/* -------------------------------------------------------------------------- */
/*  Color helpers                                                              */
/* -------------------------------------------------------------------------- */

const COLOR_BADGE: Record<string, string> = {
  amber: 'bg-amber-500/15 text-amber-700 border-amber-500/40 dark:text-amber-300',
  red: 'bg-red-500/15 text-red-700 border-red-500/40 dark:text-red-300',
  emerald:
    'bg-emerald-500/15 text-emerald-700 border-emerald-500/40 dark:text-emerald-300',
  slate: 'bg-slate-500/15 text-slate-700 border-slate-500/40 dark:text-slate-300',
  zinc: 'bg-zinc-500/15 text-zinc-700 border-zinc-500/40 dark:text-zinc-300',
  violet:
    'bg-violet-500/15 text-violet-700 border-violet-500/40 dark:text-violet-300',
  rose: 'bg-rose-500/15 text-rose-700 border-rose-500/40 dark:text-rose-300',
  cyan: 'bg-cyan-500/15 text-cyan-700 border-cyan-500/40 dark:text-cyan-300',
}

const COLOR_DOT: Record<string, string> = {
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  emerald: 'bg-emerald-500',
  slate: 'bg-slate-500',
  zinc: 'bg-zinc-500',
  violet: 'bg-violet-500',
  rose: 'bg-rose-500',
  cyan: 'bg-cyan-500',
}

function colorBadgeClass(color: string | null | undefined): string {
  const c = (color ?? 'amber').toLowerCase()
  return COLOR_BADGE[c] ?? COLOR_BADGE.amber
}

function colorDotClass(color: string | null | undefined): string {
  const c = (color ?? 'amber').toLowerCase()
  return COLOR_DOT[c] ?? COLOR_DOT.amber
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function CategoriesPage() {
  await requireAdmin()

  const categories = await db.category.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    include: {
      _count: {
        select: { articles: true },
      },
    },
  })

  const rows: CategoryRow[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    color: c.color ?? 'amber',
    order: c.order,
    articleCount: c._count.articles,
  }))

  const totalArticles = rows.reduce((s, r) => s + r.articleCount, 0)

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Kategori
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola kategori artikel portal Peredam Mobil Jakarta. Kategori
            dipakai untuk mengelompokkan artikel & filter di front-end.
          </p>
        </div>
        <CategoryDialog mode="create" />
      </div>

      {/* Quick stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Kategori
            </CardTitle>
            <FolderTree className="h-4 w-4 text-amber-500" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{rows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Artikel Terhubung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{totalArticles}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kategori Kosong
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {rows.filter((r) => r.articleCount === 0).length}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Kategori</CardTitle>
          <CardDescription>
            Diurutkan berdasarkan urutan tampil. Klik "Edit" untuk mengubah
            nama, slug, warna, atau urutan.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <FolderTree className="h-6 w-6 text-muted-foreground" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Belum ada kategori.
                </p>
                <p className="text-xs text-muted-foreground">
                  Tambahkan kategori pertama Anda.
                </p>
              </div>
              <CategoryDialog mode="create" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Nama</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead className="w-[110px]">Warna</TableHead>
                    <TableHead className="w-[120px] text-right">Artikel</TableHead>
                    <TableHead className="w-[80px] text-right">Urutan</TableHead>
                    <TableHead className="w-[200px] pr-6 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="pl-6">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-foreground">
                            {c.name}
                          </span>
                          {c.description && (
                            <span className="line-clamp-1 max-w-[280px] text-xs text-muted-foreground">
                              {c.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                          /{c.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('gap-1.5 capitalize', colorBadgeClass(c.color))}
                        >
                          <span
                            className={cn('h-2 w-2 rounded-full', colorDotClass(c.color))}
                            aria-hidden
                          />
                          {c.color}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {c.articleCount > 0 ? (
                          <Link
                            href={`/admin/articles?category=${c.slug}`}
                            className="font-semibold text-amber-600 hover:underline dark:text-amber-400"
                          >
                            {c.articleCount}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {c.order}
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="flex justify-end gap-1">
                          <CategoryDialog
                            mode="edit"
                            category={c}
                            trigger={
                              <Button size="sm" variant="ghost">
                                Edit
                              </Button>
                            }
                          />
                          <CategoryDeleteButton
                            categoryId={c.id}
                            categoryName={c.name}
                            articleCount={c.articleCount}
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
