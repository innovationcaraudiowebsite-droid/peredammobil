import Link from 'next/link'
import { HelpCircle, ArrowLeft } from 'lucide-react'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import { FaqDialog } from '@/components/admin/faq/faq-dialog'
import { FaqTable } from '@/components/admin/faq/faq-table'
import type { FaqRow } from '@/components/admin/faq/faq-dialog'

export const metadata = {
  title: 'FAQ — Admin Peredam Mobil Jakarta',
  description: 'Kelola FAQ portal.',
  robots: { index: false, follow: false },
}

export default async function FaqPage() {
  await requireAdmin()

  const faqs = await db.faq.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })

  const rows: FaqRow[] = faqs.map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
    order: f.order,
    isPublished: f.isPublished,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  }))

  const publishedCount = rows.filter((r) => r.isPublished).length
  const draftCount = rows.length - publishedCount

  // Default next order for create dialog
  const maxOrder = rows.reduce((m, r) => Math.max(m, r.order), 0)
  const nextOrder = maxOrder + 1

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            FAQ
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola daftar Frequently Asked Questions yang ditampilkan di
            front-end portal.
          </p>
        </div>
        <FaqDialog mode="create" defaultOrder={nextOrder} />
      </div>

      {/* Quick stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total FAQ
            </CardTitle>
            <HelpCircle className="h-4 w-4 text-amber-500" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{rows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {publishedCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Draft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {draftCount}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar FAQ</CardTitle>
          <CardDescription>
            Diurutkan berdasarkan urutan tampil. Gunakan tombol panah untuk
            memindahkan posisi FAQ.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <HelpCircle className="h-6 w-6 text-muted-foreground" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Belum ada FAQ.
                </p>
                <p className="text-xs text-muted-foreground">
                  Tambahkan FAQ pertama Anda.
                </p>
              </div>
              <FaqDialog mode="create" defaultOrder={nextOrder} />
            </div>
          ) : (
            <FaqTable rows={rows} />
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
