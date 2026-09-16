import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ProductForm, type InitialProductData } from '@/components/admin/products/product-form'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Edit Produk — Admin Peredam Mobil Jakarta',
  description: 'Edit produk yang sudah ada.',
  robots: { index: false, follow: false },
}

export default async function EditProductPage({
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
    console.error('[edit-product] fetch error:', err)
  }

  if (!product) notFound()

  const initial: InitialProductData = {
    id: product.id,
    name: product.name ?? '',
    description: product.description ?? '',
    price: product.price ?? '',
    category: product.category ?? 'Paket Layanan',
    imageUrl: product.imageUrl,
    imageAlt: product.imageAlt ?? '',
    waNumber: product.waNumber ?? '6282111222989',
    sortOrder: product.sortOrder ?? 0,
    isActive: product.isActive ?? true,
  }

  return (
    <>
      <ProductForm initial={initial} />
      <SonnerToaster richColors position="top-right" />
    </>
  )
}
