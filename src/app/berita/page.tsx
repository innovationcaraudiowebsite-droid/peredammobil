import { db } from '@/lib/db'
import {
  getSiteSetting,
  getFeaturedArticles,
  getLatestArticles,
  getArticlesPerCategory,
  getMostReadArticles,
  getPopularTags,
  getPublishedFaqs,
} from '@/lib/portal'
import { Header } from '@/components/portal/header'
import { BreakingTicker } from '@/components/portal/breaking-ticker'
import { HeroFeatured } from '@/components/portal/hero-featured'
import { ArticleCard } from '@/components/portal/article-card'
import { CategorySection } from '@/components/portal/category-section'
import { PopularSidebar } from '@/components/portal/popular-sidebar'
import { TagCloud } from '@/components/portal/tag-cloud'
import { NewsletterForm } from '@/components/portal/newsletter-form'
import { FaqAccordion } from '@/components/portal/faq-accordion'
import { Footer } from '@/components/portal/footer'
import { PortalBreadcrumb } from '@/components/portal/breadcrumb'
import {
  JsonLd,
  FAQPageSchema,
  WebPageSchema,
} from '@/components/seo/json-ld'

// Always render at request time (runtime) — Vercel injects env vars at
// runtime, not build time. force-dynamic prevents build-time DB queries
// that would fail when SUPABASE_URL / DATABASE_URL aren't available during
// the "Collecting page data" build phase.
export const dynamic = 'force-dynamic'
// Revalidate hint (ignored when force-dynamic, kept for documentation).
export const revalidate = 0

export default async function BeritaPage() {
  // SiteSetting (singleton).
  const settings = await getSiteSetting()

  // Fetch parallel semua data homepage.
  const [featured, mostRead, popularTags, faqs, latestForSidebar] =
    await Promise.all([
      getFeaturedArticles(3), // 3 featured (atau fallback ke populer)
      getMostReadArticles(6),
      getPopularTags(12),
      getPublishedFaqs(),
      getLatestArticles(4, []), // Untuk headline ticker + latest grid
    ])

  // Hero: main = featured[0], secondary = featured[1..2].
  const mainFeatured = featured[0]
  const secondaryFeatured = featured.slice(1, 3)

  // Headlines ticker — ambil judul artikel terbaru (8 items).
  const tickerHeadlines = latestForSidebar.slice(0, 6).map((a) => a.title)

  // Latest grid 4 — exclude featured (sudah muncul di hero).
  const featuredIds = new Set(featured.map((a) => a.id))
  const latestGrid = latestForSidebar
    .filter((a) => !featuredIds.has(a.id))
    .slice(0, 4)

  // Per-category sections — exclude featured.
  const perCategory = await getArticlesPerCategory(4, [
    ...featuredIds,
  ])

  // Sidebar kiri (2/3) — more articles (mix dari semua kategori selain featured & latest).
  const alreadyShownIds = new Set<string>([
    ...featured.map((a) => a.id),
    ...latestGrid.map((a) => a.id),
    ...mostRead.slice(0, 6).map((a) => a.id),
  ])
  const sidebarKiri = await db.article.findMany({
    where: { status: 'PUBLISHED', id: { notIn: Array.from(alreadyShownIds) } },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: 4,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      featuredImageUrl: true,
      featuredImageAlt: true,
      authorName: true,
      readingTimeMinutes: true,
      viewCount: true,
      publishedAt: true,
      isFeatured: true,
      isBreaking: true,
      category: {
        select: { id: true, name: true, slug: true, description: true, color: true },
      },
      tags: { select: { id: true, name: true, slug: true } },
    },
  })

  // Build JSON-LD schemas for /berita page.
  const faqSchema = FAQPageSchema(faqs)
  const webPageSchema = WebPageSchema({
    name: `${settings.siteName} — ${settings.tagline}`,
    description:
      'Portal media niche otomotif yang membahas peredam mobil, upgrade audio, review workshop Jakarta, tips & biaya pemasangan.',
    url: '/berita',
    speakableSelectors: ['h1', '.portal-speakable'],
  })

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        siteName={settings.siteName}
        logoUrl={settings.logoUrl}
        tagline={settings.tagline}
      />
      <BreakingTicker
        tagline={settings.tagline}
        headlines={tickerHeadlines}
      />

      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Breadcrumb: Beranda › Portal Berita */}
          <div className="pt-4">
            <PortalBreadcrumb
              items={[
                { name: 'Beranda', url: '/' },
                { name: 'Portal Berita' },
              ]}
            />
          </div>

          {/* Hero */}
          {mainFeatured && (
            <HeroFeatured
              main={mainFeatured}
              secondary={secondaryFeatured}
            />
          )}

          {/* Latest grid — 4 cards */}
          {latestGrid.length > 0 && (
            <section className="py-6 border-t border-border">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight inline-flex items-baseline gap-2">
                    <span className="size-2.5 rounded-full bg-amber-500 inline-block" aria-hidden />
                    Artikel Terbaru
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Panduan terbaru seputar peredam mobil & upgrade audio Jakarta.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {latestGrid.map((a, i) => (
                  <ArticleCard key={a.id} article={a} priority={i === 0} />
                ))}
              </div>
            </section>
          )}

          {/* 4 Category sections */}
          {perCategory.map((sec) => (
            <CategorySection
              key={sec.category.id}
              category={sec.category}
              articles={sec.articles}
            />
          ))}

          {/* Sidebar layout — 2/3 + 1/3 */}
          <section className="py-6 border-t border-border">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left 2/3 — more articles */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight inline-flex items-baseline gap-2">
                    <span className="size-2.5 rounded-full bg-amber-500 inline-block" aria-hidden />
                    Baca Selanjutnya
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Artikel pilihan lain yang mungkin relevan untuk Anda.
                  </p>
                </div>
                {sidebarKiri.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {sidebarKiri.map((a) => (
                      <ArticleCard
                        key={a.id}
                        article={a as never}
                        variant="horizontal"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground text-center">
                    Belum ada artikel lain untuk ditampilkan.
                  </div>
                )}
              </div>

              {/* Right 1/3 — sticky sidebar */}
              <aside className="lg:col-span-1 space-y-4 lg:sticky lg:top-20 self-start">
                <PopularSidebar articles={mostRead} take={6} />
                <TagCloud tags={popularTags} />
                <NewsletterForm
                  headline={settings.newsletterHeadline || 'Buletin Mingguan'}
                  subtext={
                    settings.newsletterSubtext ||
                    'Ringkasan review workshop & panduan peredam, sekali seminggu.'
                  }
                />
              </aside>
            </div>
          </section>

          {/* FAQ */}
          {faqs.length > 0 && (
            <div className="border-t border-border">
              <FaqAccordion items={faqs} />
            </div>
          )}
        </div>
      </main>

      <Footer settings={settings} />

      {/* JSON-LD structured data: FAQPage + WebPage (speakable). */}
      <JsonLd schema={webPageSchema} />
      {faqSchema && <JsonLd schema={faqSchema} />}
    </div>
  )
}
