import Link from 'next/link'
import { Tags as TagsIcon, ArrowLeft } from 'lucide-react'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
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
import { Button } from '@/components/ui/button'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import { TagDialog } from '@/components/admin/tags/tag-dialog'
import {
  TagDeleteButton,
  TagSearchBar,
} from '@/components/admin/tags/tag-actions'

export const metadata = {
  title: 'Tag — Admin Peredam Mobil Jakarta',
  description: 'Kelola tag artikel portal.',
  robots: { index: false, follow: false },
}

interface SearchParams {
  q?: string
}

const ID_DATE = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export default async function TagsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()

  const sp = await searchParams
  const q = (sp.q ?? '').trim()

  const where = q ? { name: { contains: q } } : {}

  const [tags, totalArticlesAgg] = await Promise.all([
    db.tag.findMany({
      where,
      orderBy: [{ name: 'asc' }],
    }),
    db.article.count(),
  ])

  // Fetch article counts per tag separately (replaces Prisma's _count)
  const tagIds = tags.map((t: any) => t.id)
  let countByTag = new Map<string, number>()
  if (tagIds.length > 0) {
    const { getSupabaseAdmin } = await import('@/lib/supabase-server')
    const supabase = getSupabaseAdmin()
    const { data: junction } = await supabase
      .from('_ArticleTags')
      .select('B')
      .in('B', tagIds)
    ;(junction || []).forEach((j: any) => {
      countByTag.set(j.B, (countByTag.get(j.B) || 0) + 1)
    })
  }
  // Add _count.articles to each tag for backward compat with rest of JSX
  ;(tags as any[]).forEach((t: any) => {
    t._count = { articles: countByTag.get(t.id) || 0 }
  })

  const totalTaggedArticles = totalArticlesAgg

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Tag
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola tag artikel portal. Tag membantu pembaca menemukan topik
            terkait.
          </p>
        </div>
        <TagDialog />
      </div>

      {/* Quick stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tag
            </CardTitle>
            <TagsIcon className="h-4 w-4 text-amber-500" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{tags.length}</p>
            <p className="text-xs text-muted-foreground">
              {q ? `Difilter dari pencarian "${q}"` : 'Semua tag di database'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Artikel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{totalTaggedArticles}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tag Kosong
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {tags.filter((t) => t._count.articles === 0).length}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Daftar Tag</CardTitle>
            <CardDescription>
              Cari tag by nama. Klik "Hapus" untuk menghapus tag (akan disconnect
              dari artikel jika masih dipakai).
            </CardDescription>
          </div>
          <TagSearchBar initialQuery={q} />
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {tags.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <TagsIcon className="h-6 w-6 text-muted-foreground" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {q ? 'Tidak ada tag yang cocok.' : 'Belum ada tag.'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {q ? 'Coba kata kunci lain.' : 'Tambahkan tag pertama Anda.'}
                </p>
              </div>
              {!q && <TagDialog />}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Nama</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead className="w-[110px] text-right">Artikel</TableHead>
                    <TableHead className="w-[140px]">Dibuat</TableHead>
                    <TableHead className="w-[120px] pr-6 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tags.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="pl-6 font-medium text-foreground">
                        {t.name}
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                          #{t.slug}
                        </code>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {t._count.articles > 0 ? (
                          <Link
                            href={`/admin/articles?tag=${t.slug}`}
                            className="font-semibold text-amber-600 hover:underline dark:text-amber-400"
                          >
                            {t._count.articles}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {ID_DATE.format(t.createdAt)}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <TagDeleteButton
                          tagId={t.id}
                          tagName={t.name}
                          articleCount={t._count.articles}
                        />
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
