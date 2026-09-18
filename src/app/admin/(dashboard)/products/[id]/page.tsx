import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Pencil,
  MessageCircle,
  Calendar,
  Hash,
  Tag,
  ToggleLeft,
  ToggleRight,
  ImageOff,
} from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Detail Produk — Admin Peredam Mobil Jakarta',
  description: 'Lihat detail produk.',
  robots: { index: false, follow: false },
}

/** Format ISO date → "8 Sep 2026, 14:32" */
function formatDate(d: Date | string | null): string {
  if (!d) return '—'
  const date = d instanceof Date ? d : new Date(d)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  let product: any = null
  try {
    product = await db.product.findUnique({ where: { id } })
  } catch (err) {
    console.error('[detail-product] fetch error:', err)
  }

  if (!product) notFound()

  const waLink = `https://wa.me/${product.waNumber}?text=${encodeURIComponent(
    `Halo, saya tertarik ${product.name}. Mohon info harga & detail.`,
  )}`

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <div className="mb-4">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Daftar Produk
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Detail Produk
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Informasi lengkap produk. Klik edit untuk mengubah data.
          </p>
        </div>
        <Button asChild>
          <Link href={`/admin/products/${product.id}/edit`}>
            <Pencil className="size-4" />
            Edit Produk
          </Link>
        </Button>
      </div>

      {/* Main card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Image + basic info */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-6">
          {/* Image */}
          <div className="shrink-0 relative overflow-hidden rounded-lg border border-border bg-muted w-full sm:w-48 h-48">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.imageAlt || product.name}
                fill
                sizes="(min-width: 640px) 192px, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-muted-foreground">
                <ImageOff className="size-8" />
                <span className="mt-1 text-xs">No image</span>
              </div>
            )}
          </div>

          {/* Basic info */}
          <div className="flex-1 min-w-0">
            <span className="inline-block rounded bg-brand/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
              {product.category}
            </span>
            <h2 className="mt-2 text-lg font-bold leading-snug">
              {product.name}
            </h2>
            {product.description && (
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                  product.isActive
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400'
                }`}
              >
                {product.isActive ? (
                  <ToggleRight className="size-3.5" />
                ) : (
                  <ToggleLeft className="size-3.5" />
                )}
                {product.isActive ? 'Aktif' : 'Nonaktif'}
              </span>
              {product.price && (
                <span className="text-sm font-semibold text-brand">
                  {product.price}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Detail fields */}
        <dl className="divide-y divide-border">
          {/* WA Number */}
          <div className="flex items-start gap-3 px-4 sm:px-6 py-3">
            <dt className="flex items-center gap-1.5 w-40 shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <MessageCircle className="size-3.5" />
              Nomor WA
            </dt>
            <dd className="flex-1 text-sm">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-emerald-600 hover:underline"
              >
                {product.waNumber}
              </a>
              <span className="ml-2 text-xs text-muted-foreground">
                (klik untuk buka chat)
              </span>
            </dd>
          </div>

          {/* Sort order */}
          <div className="flex items-start gap-3 px-4 sm:px-6 py-3">
            <dt className="flex items-center gap-1.5 w-40 shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Hash className="size-3.5" />
              Urutan Tampil
            </dt>
            <dd className="flex-1 text-sm font-medium">{product.sortOrder ?? 0}</dd>
          </div>

          {/* Category */}
          <div className="flex items-start gap-3 px-4 sm:px-6 py-3">
            <dt className="flex items-center gap-1.5 w-40 shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Tag className="size-3.5" />
              Kategori
            </dt>
            <dd className="flex-1 text-sm font-medium">{product.category}</dd>
          </div>

          {/* Image Alt */}
          {product.imageAlt && (
            <div className="flex items-start gap-3 px-4 sm:px-6 py-3">
              <dt className="flex items-center gap-1.5 w-40 shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <ImageOff className="size-3.5" />
                Alt Text
              </dt>
              <dd className="flex-1 text-sm text-muted-foreground">
                {product.imageAlt}
              </dd>
            </div>
          )}

          {/* Image URL */}
          {product.imageUrl && (
            <div className="flex items-start gap-3 px-4 sm:px-6 py-3">
              <dt className="flex items-center gap-1.5 w-40 shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <ImageOff className="size-3.5" />
                Image URL
              </dt>
              <dd className="flex-1 text-xs text-muted-foreground break-all">
                {product.imageUrl}
              </dd>
            </div>
          )}

          {/* Created at */}
          <div className="flex items-start gap-3 px-4 sm:px-6 py-3">
            <dt className="flex items-center gap-1.5 w-40 shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Calendar className="size-3.5" />
              Dibuat
            </dt>
            <dd className="flex-1 text-sm text-muted-foreground">
              {formatDate(product.createdAt)}
            </dd>
          </div>

          {/* Updated at */}
          <div className="flex items-start gap-3 px-4 sm:px-6 py-3">
            <dt className="flex items-center gap-1.5 w-40 shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Calendar className="size-3.5" />
              Diperbarui
            </dt>
            <dd className="flex-1 text-sm text-muted-foreground">
              {formatDate(product.updatedAt)}
            </dd>
          </div>

          {/* Product ID */}
          <div className="flex items-start gap-3 px-4 sm:px-6 py-3">
            <dt className="flex items-center gap-1.5 w-40 shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Hash className="size-3.5" />
              Product ID
            </dt>
            <dd className="flex-1 text-xs text-muted-foreground font-mono break-all">
              {product.id}
            </dd>
          </div>
        </dl>
      </div>

      {/* Action bar */}
      <div className="mt-6 flex gap-2">
        <Button asChild variant="outline">
          <Link href="/admin/products">
            <ArrowLeft className="size-4" />
            Kembali
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/admin/products/${product.id}/edit`}>
            <Pencil className="size-4" />
            Edit Produk
          </Link>
        </Button>
      </div>

      <SonnerToaster richColors position="top-right" />
    </div>
  )
}
