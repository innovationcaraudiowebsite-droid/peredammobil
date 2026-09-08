import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Calendar, Clock, Eye, Tag, User, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const runtime = 'nodejs'

export const metadata = {
  title: 'Preview Artikel — Admin Peredam Mobil Jakarta',
  description: 'Preview tampilan artikel seperti di front-end.',
  robots: { index: false, follow: false },
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const article = await db.article.findUnique({
    where: { id },
    include: {
      category: true,
      tags: true,
    },
  })
  if (!article) notFound()

  const publishedAtStr = article.publishedAt
    ? format(article.publishedAt, 'd MMMM yyyy HH:mm', { locale: localeId })
    : format(article.createdAt, 'd MMMM yyyy HH:mm', { locale: localeId })

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link
          href={`/admin/articles/${article.id}/edit`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Edit
        </Link>
        <Badge variant="outline" className="gap-1.5">
          <span
            className={
              'h-1.5 w-1.5 rounded-full ' +
              (article.status === 'PUBLISHED'
                ? 'bg-emerald-500'
                : article.status === 'DRAFT'
                  ? 'bg-slate-400'
                  : 'bg-zinc-500')
            }
          />
          {article.status}
        </Badge>
      </div>

      {/* Article front-end mockup */}
      <article className="overflow-hidden rounded-xl border bg-background shadow-sm">
        {/* Hero */}
        {article.featuredImageUrl && (
          <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
            <img
              src={article.featuredImageUrl}
              alt={article.featuredImageAlt || article.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="space-y-5 p-6 sm:p-8">
          {/* Category badge */}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700'
              }
            >
              {article.category.name}
            </Badge>
            {article.isFeatured && (
              <Badge
                variant="outline"
                className="border-amber-400 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
              >
                Featured
              </Badge>
            )}
            {article.isBreaking && (
              <Badge
                variant="outline"
                className="border-red-400 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200"
              >
                Breaking
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {article.title}
          </h1>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-lg text-muted-foreground">{article.excerpt}</p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 border-y py-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {article.authorName}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {publishedAtStr} WIB
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {article.readingTimeMinutes} menit baca
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {article.viewCount.toLocaleString('id-ID')} views
            </span>
          </div>

          {/* Content */}
          <div
            className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-amber-600 prose-img:rounded-lg"
            dangerouslySetInnerHTML={{ __html: article.content || '' }}
          />

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t pt-4">
              <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
                <Tag className="h-4 w-4" />
                Tag:
              </span>
              {article.tags.map((t) => (
                <Badge key={t.id} variant="secondary" className="gap-1">
                  #{t.name}
                </Badge>
              ))}
            </div>
          )}

          {/* SEO info footer */}
          <details className="rounded-lg border bg-muted/30 p-3 text-sm">
            <summary className="cursor-pointer font-medium">
              SEO Info (admin only)
            </summary>
            <dl className="mt-2 space-y-1 text-xs">
              <div>
                <dt className="font-semibold">Meta Title:</dt>
                <dd className="text-muted-foreground">{article.metaTitle}</dd>
              </div>
              <div>
                <dt className="font-semibold">Meta Description:</dt>
                <dd className="text-muted-foreground">{article.metaDescription}</dd>
              </div>
              <div>
                <dt className="font-semibold">Meta Keywords:</dt>
                <dd className="text-muted-foreground">{article.metaKeywords || '-'}</dd>
              </div>
              <div>
                <dt className="font-semibold">Slug:</dt>
                <dd className="text-muted-foreground">/berita/{article.category.slug}/{article.slug}</dd>
              </div>
              <div>
                <dt className="font-semibold">Word count:</dt>
                <dd className="text-muted-foreground">{article.wordCount.toLocaleString('id-ID')}</dd>
              </div>
            </dl>
          </details>
        </div>
      </article>

      <div className="mt-4 flex justify-end">
        <Button asChild>
          <Link href={`/admin/articles/${article.id}/edit`}>
            <ArrowLeft className="h-4 w-4" />
            Edit Artikel
          </Link>
        </Button>
      </div>
    </div>
  )
}
