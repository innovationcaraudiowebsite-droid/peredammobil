import { notFound } from 'next/navigation'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  ArticleForm,
  type InitialArticleData,
} from '@/components/admin/articles/article-form'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'

export const runtime = 'nodejs'

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

  const article = await db.article.findUnique({
    where: { id },
    include: {
      category: true,
      tags: true,
      versions: { orderBy: { versionNumber: 'desc' } },
    },
  })
  if (!article) {
    notFound()
  }

  const [categories, tags, featuredCount] = await Promise.all([
    db.category.findMany({
      orderBy: { order: 'asc' },
      select: { id: true, name: true, slug: true, color: true, description: true },
    }),
    db.tag.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
    db.article.count({ where: { isFeatured: true, NOT: { id } } }),
  ])

  const initial: InitialArticleData = {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt ?? '',
    contentMarkdown: article.contentMarkdown ?? '',
    featuredImageUrl: article.featuredImageUrl,
    featuredImageAlt: article.featuredImageAlt ?? '',
    categoryId: article.categoryId,
    authorName: article.authorName,
    status: article.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    isFeatured: article.isFeatured,
    isBreaking: article.isBreaking,
    metaTitle: article.metaTitle ?? '',
    metaDescription: article.metaDescription ?? '',
    metaKeywords: article.metaKeywords ?? '',
    ogImageUrl: article.ogImageUrl,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    tagIds: article.tags.map((t) => t.id),
    versions: article.versions.map((v) => ({
      id: v.id,
      versionNumber: v.versionNumber,
      title: v.title,
      excerpt: v.excerpt,
      editedBy: v.editedBy,
      editNote: v.editNote,
      createdAt: v.createdAt.toISOString(),
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
      <ArticleForm
        initial={initial}
        categories={categories}
        tags={tags}
        featuredCount={featuredCount}
      />
      <SonnerToaster richColors position="top-right" />
    </div>
  )
}
