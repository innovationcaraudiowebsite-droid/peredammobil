import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  CalendarDays,
  Clock,
  Eye,
  User,
  ChevronRight,
  Home as HomeIcon,
} from 'lucide-react'
import { db } from '@/lib/db'
import {
  getSiteSetting,
  getArticleByCategoryAndSlug,
  getRelatedArticles,
  getApprovedComments,
  categoryBadgeClass,
} from '@/lib/portal'
import { Header } from '@/components/portal/header'
import { Footer } from '@/components/portal/footer'
import { ArticleCard } from '@/components/portal/article-card'
import { NewsletterForm } from '@/components/portal/newsletter-form'
import { ViewTracker, ShareButtons } from '@/components/portal/view-tracker'
import { CommentSection } from '@/components/portal/comment-section'
import { formatTanggalPanjang, formatNumber } from '@/lib/format-tanggal'

// Revalidate every 60s for ISR
export const revalidate = 60

/**
 * Generate <title>, <meta>, OpenGraph, Twitter, dan JSON-LD dari data artikel.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>
}): Promise<Metadata> {
  const { category, slug } = await params
  const article = await getArticleByCategoryAndSlug(category, slug)
  if (!article) {
    return {
      title: 'Artikel tidak ditemukan',
      robots: { index: false, follow: false },
    }
  }
  const settings = await getSiteSetting()
  const title =
    article.metaTitle ||
    `${article.title} — ${article.category.name} | ${settings.siteName}`
  const description =
    article.metaDescription ||
    article.excerpt ||
    'Artikel dari portal media Peredam Mobil Jakarta.'
  const keywords = article.metaKeywords
    ? article.metaKeywords
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : article.tags.map((t) => t.name)
  const imageUrl = article.ogImageUrl || article.featuredImageUrl || undefined
  const url = `/berita/${article.category.slug}/${article.slug}`

  return {
    title,
    description,
    keywords,
    authors: [{ name: article.authorName }],
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      siteName: settings.siteName,
      locale: 'id_ID',
      publishedTime: article.publishedAt?.toISOString(),
      authors: [article.authorName],
      tags: article.tags.map((t) => t.name),
      images: imageUrl ? [{ url: imageUrl, alt: article.featuredImageAlt || article.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
    robots: { index: true, follow: true },
  }
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>
}) {
  const { category, slug } = await params
  const article = await getArticleByCategoryAndSlug(category, slug)
  if (!article) {
    notFound()
  }

  // Related articles (same category) + approved comments + site settings — parallel.
  const [related, comments, settings] = await Promise.all([
    getRelatedArticles(article.id, article.category.id, 3),
    getApprovedComments(article.id),
    getSiteSetting(),
  ])

  const badgeClass = categoryBadgeClass(article.category.color)
  const dateLabel = formatTanggalPanjang(article.publishedAt)
  const articleUrl = `/berita/${article.category.slug}/${article.slug}`
  const ogImage = article.ogImageUrl || article.featuredImageUrl

  // JSON-LD NewsArticle schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description:
      article.metaDescription || article.excerpt || undefined,
    image: ogImage ? [ogImage] : undefined,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt?.toISOString(),
    author: {
      '@type': 'Organization',
      name: article.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: settings.siteName,
      logo: settings.logoUrl
        ? { '@type': 'ImageObject', url: settings.logoUrl }
        : undefined,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    articleSection: article.category.name,
    keywords: article.tags.map((t) => t.name).join(', '),
    wordCount: article.wordCount,
    articleBody: article.contentMarkdown || undefined,
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        siteName={settings.siteName}
        logoUrl={settings.logoUrl}
        tagline={settings.tagline}
      />
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground mb-4"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-1 hover:text-primary"
            >
              <HomeIcon className="size-3.5" />
              Beranda
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <Link
              href={`/kategori/${article.category.slug}`}
              className="hover:text-primary"
            >
              {article.category.name}
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <span className="text-foreground font-medium line-clamp-1">
              {article.title}
            </span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-12">
            {/* Main article */}
            <article className="lg:col-span-8 min-w-0">
              {/* Category badge */}
              <span
                className={`inline-block rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${badgeClass}`}
              >
                {article.category.name}
              </span>

              {/* Title */}
              <h1 className="mt-3 text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
                {article.title}
              </h1>

              {/* Excerpt */}
              {article.excerpt && (
                <p className="mt-3 text-base sm:text-lg text-muted-foreground leading-7">
                  {article.excerpt}
                </p>
              )}

              {/* Meta */}
              <div className="mt-5 flex flex-wrap items-center gap-4 pb-5 border-b border-border text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <User className="size-4 text-amber-500" aria-hidden />
                  <span className="font-medium text-foreground">{article.authorName}</span>
                </span>
                {dateLabel && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-4 text-amber-500" aria-hidden />
                    {dateLabel}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4 text-amber-500" aria-hidden />
                  {article.readingTimeMinutes} menit baca
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="size-4 text-amber-500" aria-hidden />
                  {formatNumber(article.viewCount)} dibaca
                </span>
              </div>

              {/* Featured image */}
              {article.featuredImageUrl && (
                <figure className="mt-6">
                  <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted">
                    <img
                      src={article.featuredImageUrl}
                      alt={article.featuredImageAlt || article.title}
                      className="absolute inset-0 size-full object-cover"
                      loading="eager"
                      fetchPriority="high"
                    />
                  </div>
                  {article.featuredImageAlt && (
                    <figcaption className="mt-2 text-xs text-muted-foreground text-center italic">
                      {article.featuredImageAlt}
                    </figcaption>
                  )}
                </figure>
              )}

              {/* Share buttons */}
              <div className="mt-6">
                <ShareButtons url={articleUrl} title={article.title} />
              </div>

              {/* Content */}
              <div
                className="portal-article mt-8 text-[17px] leading-8 text-foreground/90 [&_p]:my-4 [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:text-lg [&_h4]:font-semibold [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-amber-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a:hover]:no-underline [&_img]:my-4 [&_img]:rounded-lg [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm [&_code]:font-mono [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-900 [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-slate-100 [&_hr]:my-6 [&_hr]:border-border [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2 [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:p-2"
                dangerouslySetInnerHTML={{ __html: article.content || '' }}
              />

              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2 pt-6 border-t border-border">
                  <span className="text-sm font-medium text-muted-foreground mr-1">
                    Tag:
                  </span>
                  {article.tags.map((t) => (
                    <Link
                      key={t.id}
                      href={`/pencarian?q=${encodeURIComponent(t.name)}`}
                      className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                    >
                      #{t.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Newsletter inline */}
              <div className="mt-8 rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-card p-5">
                <NewsletterForm
                  variant="inline"
                  headline={settings.newsletterHeadline || 'Buletin Mingguan'}
                  subtext={settings.newsletterSubtext || ''}
                />
              </div>

              {/* Comments */}
              <CommentSection
                articleId={article.id}
                initialComments={comments.map((c) => ({
                  id: c.id,
                  authorName: c.authorName,
                  content: c.content,
                  createdAt: c.createdAt.toISOString(),
                }))}
              />
            </article>

            {/* Related sidebar */}
            <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-20 self-start">
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-amber-500/10 to-transparent">
                  <h3 className="font-bold text-base">Artikel Terkait</h3>
                </div>
                <div className="p-4 space-y-4">
                  {related.length > 0 ? (
                    related.map((a) => (
                      <ArticleCard key={a.id} article={a} variant="horizontal" />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Belum ada artikel terkait.
                    </p>
                  )}
                </div>
              </div>
              <NewsletterForm
                variant="compact"
                headline={settings.newsletterHeadline || 'Buletin Mingguan'}
                subtext={settings.newsletterSubtext || ''}
              />
            </aside>
          </div>
        </div>
      </main>
      <Footer settings={settings} />

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      {/* View tracker (client component, fire & forget) */}
      <ViewTracker slug={article.slug} />
    </div>
  )
}
