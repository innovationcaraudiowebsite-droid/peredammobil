import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  ArticleForm,
  type InitialArticleData,
} from '@/components/admin/articles/article-form'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Edit Artikel — Admin Peredam Mobil Jakarta',
  description: 'Edit artikel yang sudah ada.',
  robots: { index: false, follow: false },
}

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  // Fetch article — use try/catch + null-safe untuk mencegah 500
  let article: any = null
  try {
    article = await db.article.findUnique({
      where: { id },
      include: {
        category: true,
        tags: true,
      },
    })
  } catch (err) {
    console.error('[edit-article] fetch article failed:', err)
  }

  if (!article) {
    notFound()
  }

  // Fetch categories, tags, versions, featured count separately (lebih reliable)
  let categories: any[] = []
  let tags: any[] = []
  let featuredCount = 0
  let versions: any[] = []

  try {
    [categories, tags, versions] = await Promise.all([
      db.category.findMany({
        orderBy: { order: 'asc' },
        select: { id: true, name: true, slug: true, color: true, description: true },
      }),
      db.tag.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true },
      }),
      db.articleVersion.findMany({
        where: { articleId: id },
        orderBy: { versionNumber: 'desc' },
      }),
    ])
  } catch (err) {
    console.error('[edit-article] fetch related data failed:', err)
  }

  // Count featured (exclude current article) — use simple count
  try {
    const allFeatured = await db.article.findMany({
      where: { isFeatured: true },
      select: { id: true },
    })
    featuredCount = (allFeatured || []).filter((a: any) => a.id !== id).length
  } catch {
    featuredCount = 0
  }

  // Build initial data — null-safe untuk semua field
  const initial: InitialArticleData = {
    id: article.id,
    title: article.title ?? '',
    slug: article.slug ?? '',
    excerpt: article.excerpt ?? '',
    contentMarkdown: article.contentMarkdown ?? '',
    featuredImageUrl: article.featuredImageUrl,
    featuredImageAlt: article.featuredImageAlt ?? '',
    categoryId: article.categoryId,
    authorName: article.authorName ?? 'Innovation Car Audio',
    status: (article.status ?? 'DRAFT') as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    isFeatured: article.isFeatured ?? false,
    isBreaking: article.isBreaking ?? false,
    metaTitle: article.metaTitle ?? '',
    metaDescription: article.metaDescription ?? '',
    metaKeywords: article.metaKeywords ?? '',
    ogImageUrl: article.ogImageUrl,
    targetKeyword: (article as { targetKeyword?: string }).targetKeyword ?? '',
    publishedAt: article.publishedAt instanceof Date
      ? article.publishedAt.toISOString()
      : (article.publishedAt ?? null),
    tagIds: (article.tags || []).map((t: any) => t.id),
    versions: (versions || []).map((v: any) => ({
      id: v.id,
      versionNumber: v.versionNumber,
      title: v.title,
      excerpt: v.excerpt,
      editedBy: v.editedBy,
      editNote: v.editNote,
      createdAt: v.createdAt instanceof Date
        ? v.createdAt.toISOString()
        : (v.createdAt ?? new Date().toISOString()),
    })),
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 text-xl font-bold tracking-tight sm:text-2xl">
        Edit Artikel
      </h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Slug saat ini: <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{article.slug}</code>
      </p>
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Memuat form edit...</div>}>
        <ArticleForm
          initial={initial}
          categories={categories}
          tags={tags}
          featuredCount={featuredCount}
        />
      </Suspense>
      <SonnerToaster richColors position="top-right" />
    </div>
  )
}
