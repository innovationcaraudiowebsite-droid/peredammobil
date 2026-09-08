import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ArticleForm } from '@/components/admin/articles/article-form'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'Tambah Artikel Baru — Admin Peredam Mobil Jakarta',
  description: 'Buat artikel baru dengan editor 4-tab.',
  robots: { index: false, follow: false },
}

export default async function NewArticlePage() {
  await requireAdmin()

  const [categories, tags, featuredCount] = await Promise.all([
    db.category.findMany({
      orderBy: { order: 'asc' },
      select: { id: true, name: true, slug: true, color: true, description: true },
    }),
    db.tag.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
    db.article.count({ where: { isFeatured: true } }),
  ])

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 text-xl font-bold tracking-tight sm:text-2xl">
        Artikel Baru
      </h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Isi konten, klasifikasi, SEO, dan publikasi. Konten akan disimpan sebagai draft
        sampai Anda klik tombol Publish.
      </p>
      <ArticleForm
        initial={null}
        categories={categories}
        tags={tags}
        featuredCount={featuredCount}
      />
      <SonnerToaster richColors position="top-right" />
    </div>
  )
}
