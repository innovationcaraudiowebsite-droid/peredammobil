import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  calculateReadingTime,
  calculateWordCount,
  renderMarkdownToHtml,
} from '@/lib/article'

export const runtime = 'nodejs'

interface RestoreBody {
  versionId?: unknown
}

/**
 * POST /api/admin/articles/[id]/restore-version
 * Restore article ke versi lama. Body: { versionId }
 * Setelah restore: title, content (markdown), excerpt dipulihkan dari version.
 * ArticleVersion.content berisi markdown source.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin()
  const { id } = await params

  let body: RestoreBody = {}
  try {
    body = await req.json()
  } catch {
    /* */
  }
  const versionId = typeof body.versionId === 'string' ? body.versionId : ''
  if (!versionId) {
    return NextResponse.json({ ok: false, message: 'versionId wajib.' }, { status: 400 })
  }

  const version = await db.articleVersion.findFirst({
    where: { id: versionId, articleId: id },
  })
  if (!version) {
    return NextResponse.json({ ok: false, message: 'Versi tidak ditemukan.' }, { status: 404 })
  }

  // version.content adalah markdown source
  const md = version.content
  const contentHtml = renderMarkdownToHtml(md)

  await db.article.update({
    where: { id },
    data: {
      title: version.title,
      content: contentHtml,
      contentMarkdown: md,
      excerpt: version.excerpt,
      wordCount: calculateWordCount(md),
      readingTimeMinutes: calculateReadingTime(md),
    },
  })

  // Create new snapshot untuk merekam bahwa restore dilakukan
  const last = await db.articleVersion.findFirst({
    where: { articleId: id },
    orderBy: { versionNumber: 'desc' },
    select: { versionNumber: true },
  })
  const nextVer = (last?.versionNumber ?? 0) + 1
  await db.articleVersion.create({
    data: {
      articleId: id,
      versionNumber: nextVer,
      title: version.title,
      content: md,
      excerpt: version.excerpt,
      editedBy: 'admin',
      editNote: `Restore dari v${version.versionNumber}`,
    },
  })

  return NextResponse.json({ ok: true, restoredFrom: version.versionNumber })
}
