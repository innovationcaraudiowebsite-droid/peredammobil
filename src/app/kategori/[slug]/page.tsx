import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, Folder } from 'lucide-react'
import {
  getSiteSetting,
  getArticlesByCategory,
  categoryBadgeClass,
} from '@/lib/portal'
import { Header } from '@/components/portal/header'
import { Footer } from '@/components/portal/footer'
import { ArticleCard } from '@/components/portal/article-card'
import { NewsletterForm } from '@/components/portal/newsletter-form'
import { PortalBreadcrumb } from '@/components/portal/breadcrumb'
import {
  JsonLd,
  CollectionPageSchema,
} from '@/components/seo/json-ld'
import { db } from '@/lib/db'

// Revalidate every 1 hour — category listing rarely changes.
export const revalidate = 3600

const PAGE_SIZE = 12
const SITE_URL = 'https://peredammobiljakarta.com'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { category } = await getArticlesByCategory(slug, 0, 0)
  if (!category) {
    return {
      title: 'Kategori tidak ditemukan',
      robots: { index: false, follow: false },
    }
  }
  const settings = await getSiteSetting()
  const title = `${category.name} — Artikel Terbaru | ${settings.siteName}`
  const description =
    category.description ||
    `Kumpulan artikel di kategori ${category.name} dari portal ${settings.siteName}.`
  const url = `/kategori/${category.slug}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `${SITE_URL}${url}`,
      siteName: settings.siteName,
      locale: 'id_ID',
      images: [{ url: '/og-default.png', width: 1200, height: 630, alt: category.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-default.png'],
    },
    robots: { index: true, follow: true },
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { slug } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1)
  const skip = (page - 1) * PAGE_SIZE
  const { category, items, total } = await getArticlesByCategory(
    slug,
    PAGE_SIZE,
    skip,
  )
  if (!category) notFound()

  const settings = await getSiteSetting()
  const badgeClass = categoryBadgeClass(category.color)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasPrev = page > 1
  const hasNext = page < totalPages

  // Category-specific tag breakdown (top 10 by article count).
  const tagCountsRaw = await db.tag.findMany({
    where: { articles: { some: { categoryId: category.id } } },
    select: {
      id: true,
      name: true,
      slug: true,
      articles: { where: { categoryId: category.id }, select: { id: true } },
    },
  })
  const topTags = tagCountsRaw
    .map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      count: t.articles.length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // JSON-LD schemas — BreadcrumbList is rendered by PortalBreadcrumb component,
  // here we only emit CollectionPage.
  const collectionSchema = CollectionPageSchema({
    name: category.name,
    description: category.description || undefined,
    url: `/kategori/${category.slug}`,
    numberOfItems: total,
  })

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        siteName={settings.siteName}
        logoUrl={settings.logoUrl}
        tagline={settings.tagline}
      />
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          {/* Breadcrumb (visual + JSON-LD). */}
          <PortalBreadcrumb
            items={[
              { name: 'Beranda', url: '/' },
              { name: category.name },
            ]}
          />

          {/* Category header */}
          <header className="mb-6 pb-6 border-b border-border">
            <div className="flex items-start gap-3">
              <span
                className={`mt-1 inline-grid place-items-center size-10 rounded-lg shrink-0 ${badgeClass}`}
              >
                <Folder className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {category.name}
                </h1>
                {category.description && (
                  <p className="mt-1.5 text-muted-foreground leading-7 max-w-3xl">
                    {category.description}
                  </p>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  {total} artikel total · halaman {page} dari {totalPages}
                </p>
              </div>
            </div>
            {topTags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {topTags.map((t) => (
                  <Link
                    key={t.id}
                    href={`/pencarian?q=${encodeURIComponent(t.name)}`}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                    title={`${t.count} artikel`}
                  >
                    #{t.name}
                  </Link>
                ))}
              </div>
            )}
          </header>

          <div className="grid gap-8 lg:grid-cols-12">
            {/* Article grid */}
            <div className="lg:col-span-8 min-w-0">
              {items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {items.map((a, i) => (
                    <ArticleCard
                      key={a.id}
                      article={a}
                      priority={page === 1 && i === 0}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
                  Belum ada artikel di kategori ini.
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <nav
                  aria-label="Pagination"
                  className="mt-8 flex items-center justify-center gap-2"
                >
                  <Link
                    href={`/kategori/${category.slug}?page=${page - 1}`}
                    aria-disabled={!hasPrev}
                    className={`inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors ${
                      hasPrev
                        ? 'hover:bg-muted hover:border-primary/40'
                        : 'opacity-40 pointer-events-none'
                    }`}
                  >
                    <ChevronRight className="size-4 rotate-180" aria-hidden />
                    Prev
                  </Link>
                  <div className="flex items-center gap-1">
                    {pageNumbers(page, totalPages).map((p, i) => (
                      <span key={i}>
                        {p === '…' ? (
                          <span className="px-2 text-muted-foreground">…</span>
                        ) : (
                          <Link
                            href={`/kategori/${category.slug}?page=${p}`}
                            aria-current={p === page ? 'page' : undefined}
                            className={`grid place-items-center size-8 rounded-md text-sm font-medium transition-colors ${
                              p === page
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                          >
                            {p}
                          </Link>
                        )}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/kategori/${category.slug}?page=${page + 1}`}
                    aria-disabled={!hasNext}
                    className={`inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors ${
                      hasNext
                        ? 'hover:bg-muted hover:border-primary/40'
                        : 'opacity-40 pointer-events-none'
                    }`}
                  >
                    Next
                    <ChevronRight className="size-4" aria-hidden />
                  </Link>
                </nav>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-20 self-start">
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-bold text-base mb-2">Tentang Kategori</h3>
                <p className="text-sm text-muted-foreground leading-7">
                  {category.description || 'Kategori artikel portal.'}
                </p>
                <Link
                  href="/"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  ← Kembali ke Beranda
                </Link>
              </div>
              <NewsletterForm
                variant="default"
                headline={settings.newsletterHeadline || 'Buletin Mingguan'}
                subtext={settings.newsletterSubtext || ''}
              />
            </aside>
          </div>
        </div>
      </main>
      <Footer settings={settings} />

      {/* JSON-LD structured data: CollectionPage (BreadcrumbList emitted by PortalBreadcrumb). */}
      <JsonLd schema={collectionSchema} />
    </div>
  )
}

/** Build pagination page numbers with ellipsis for very long lists. */
function pageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const out: (number | '…')[] = []
  out.push(1)
  if (current > 3) out.push('…')
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    out.push(p)
  }
  if (current < total - 2) out.push('…')
  out.push(total)
  return out
}
