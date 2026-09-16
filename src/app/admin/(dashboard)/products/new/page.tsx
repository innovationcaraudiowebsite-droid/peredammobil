import { requireAdmin } from '@/lib/auth'
import { ProductForm } from '@/components/admin/products/product-form'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'Tambah Produk — Admin Peredam Mobil Jakarta',
  description: 'Tambah produk baru untuk landing page.',
  robots: { index: false, follow: false },
}

export default async function NewProductPage() {
  await requireAdmin()

  return (
    <>
      <ProductForm initial={null} />
      <SonnerToaster richColors position="top-right" />
    </>
  )
}
