import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ProductsTable } from '@/components/admin/products/products-table'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import { Package, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Produk — Admin Peredam Mobil Jakarta',
  description: 'Kelola produk untuk landing page Section 4 (Paket Layanan).',
  robots: { index: false, follow: false },
}

export default async function ProductsPage() {
  await requireAdmin()

  let products: any[] = []
  try {
    products = await db.product.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    })
  } catch (err) {
    console.error('[admin/products] fetch error:', err)
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
            <Package className="size-6 text-brand" />
            Produk
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola produk untuk landing page Section 4 (Paket Layanan).
            Produk aktif akan tampil di landing dengan CTA WhatsApp.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="size-4" />
            Tambah Produk
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card p-3">
          <div className="text-xs text-muted-foreground">Total Produk</div>
          <div className="mt-1 text-2xl font-bold">{products.length}</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="text-xs text-muted-foreground">Aktif</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">
            {products.filter((p: any) => p.isActive).length}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="text-xs text-muted-foreground">Nonaktif</div>
          <div className="mt-1 text-2xl font-bold text-slate-500">
            {products.filter((p: any) => !p.isActive).length}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="text-xs text-muted-foreground">Kategori</div>
          <div className="mt-1 text-2xl font-bold">
            {new Set(products.map((p: any) => p.category)).size}
          </div>
        </div>
      </div>

      {/* Table */}
      <ProductsTable products={products} />

      <SonnerToaster richColors position="top-right" />
    </div>
  )
}
