import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Search as SearchIcon, ChevronRight, AlertCircle } from 'lucide-react'
import { getSiteSetting, searchArticles } from '@/lib/portal'
import { Header } from '@/components/portal/header'
import { Footer } from '@/components/portal/footer'
import { ArticleCard } from '@/components/portal/article-card'
import { NewsletterForm } from '@/components/portal/newsletter-form'
import { SearchForm, SearchSkeleton } from '@/components/portal/search-form'
import { PortalBreadcrumb } from '@/components/portal/breadcrumb'
import { formatNumber } from '@/lib/format-tanggal'

// Search results pages should be noindex.
export const revalidate = 30
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pencarian Artikel',
  description:
    'Cari artikel tentang peredam mobil, upgrade audio, dan workshop di Jakarta.',
  robots: { index: false, follow: true },
}

const PAGE_SIZE = 12

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const sp = await searchParams
  const q = (sp.q || '').trim()
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1)
  const skip = (page - 1) * PAGE_SIZE

  const settings = await getSiteSetting()
  let items: Awaited<ReturnType<typeof searchArticles>>['items'] = []
  let total = 0
  if (q) {
    const result = await searchArticles(q, PAGE_SIZE, skip)
    items = result.items
    total = result.total
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        siteName={settings.siteName}
        logoUrl={settings.logoUrl}
        tagline={settings.tagline}
      />
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          {/* Breadcrumb (visual only — page is noindex). */}
          <PortalBreadcrumb
            items={[
              { name: 'Beranda', url: '/' },
              { name: 'Pencarian' },
            ]}
          />

          <header className="mb-6 pb-6 border-b border-border">
            <h1 className="inline-flex items-center gap-2 text-2xl sm:text-3xl font-bold tracking-tight">
              <SearchIcon className="size-7 text-amber-500" aria-hidden />
              Pencarian Artikel
            </h1>
            <p className="mt-1.5 text-muted-foreground text-sm">
              Cari artikel di portal {settings.siteName} berdasarkan judul, kutipan, isi, atau penulis.
            </p>
            <div className="mt-4">
              <Suspense fallback={<SearchSkeleton />}>
                <SearchForm initialQuery={q} />
              </Suspense>
            </div>
          </header>

          {/* Results */}
          {!q ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
              <SearchIcon className="size-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="font-medium text-foreground">Ketik kata kunci di kotak pencarian di atas</p>
              <p className="mt-1 text-sm">Hasil pencarian akan muncul di sini.</p>
            </div>
          ) : total === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center">
              <AlertCircle className="size-10 mx-auto text-amber-500 mb-3" />
              <p className="font-medium">
                Tidak ada hasil untuk &quot;<span className="text-primary">{q}</span>&quot;
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Coba kata kunci lain, misalnya: peredam, audio, DSP, workshop, jakarta.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {['peredam pintu', 'DSP', 'workshop jakarta', 'butyl', 'speaker split'].map((tag) => (
                  <Link
                    key={tag}
                    href={`/pencarian?q=${encodeURIComponent(tag)}`}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                Ditemukan{' '}
                <span className="font-semibold text-foreground">{formatNumber(total)}</span>{' '}
                hasil untuk{' '}
                <span className="font-semibold text-primary">&quot;{q}&quot;</span>
                {totalPages > 1 && (
                  <>
                    {' '}· halaman <span className="font-semibold">{page}</span> dari{' '}
                    <span className="font-semibold">{totalPages}</span>
                  </>
                )}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((a, i) => (
                  <ArticleCard key={a.id} article={a} priority={page === 1 && i === 0} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav
                  aria-label="Pagination"
                  className="mt-8 flex items-center justify-center gap-2"
                >
                  <Link
                    href={`/pencarian?q=${encodeURIComponent(q)}&page=${page - 1}`}
                    aria-disabled={page <= 1}
                    className={`inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors ${
                      page > 1
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
                            href={`/pencarian?q=${encodeURIComponent(q)}&page=${p}`}
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
                    href={`/pencarian?q=${encodeURIComponent(q)}&page=${page + 1}`}
                    aria-disabled={page >= totalPages}
                    className={`inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors ${
                      page < totalPages
                        ? 'hover:bg-muted hover:border-primary/40'
                        : 'opacity-40 pointer-events-none'
                    }`}
                  >
                    Next
                    <ChevronRight className="size-4" aria-hidden />
                  </Link>
                </nav>
              )}
            </>
          )}

          {/* Inline newsletter (always) */}
          <div className="mt-12 max-w-2xl">
            <NewsletterForm
              variant="default"
              headline={settings.newsletterHeadline || 'Buletin Mingguan'}
              subtext={settings.newsletterSubtext || ''}
            />
          </div>
        </div>
      </main>
      <Footer settings={settings} />
    </div>
  )
}

/** Build pagination page numbers with ellipsis. */
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
