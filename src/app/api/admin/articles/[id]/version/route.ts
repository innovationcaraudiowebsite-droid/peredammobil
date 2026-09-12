import { NextRequest, NextResponse } from 'next/server'

import { requireAdminApi } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  calculateReadingTime,
  calculateWordCount,
  renderMarkdownToHtml,
} from '@/lib/article'

export const runtime = 'nodejs'

interface VersionBody {
  editNote?: unknown
  /** Bila ingin pakai konten yang berbeda dari artikel saat ini (misalnya restore preview).
   *  Bila tidak dikirim, snapshot ambil dari artikel existing. */
  title?: unknown
  contentMarkdown?: unknown
  excerpt?: unknown
}

/**
 * GET /api/admin/articles/[id]/version
 * List semua version untuk artikel (sort desc).
 * Field `content` berisi markdown source (disimpan sebagai text).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const versions = await db.articleVersion.findMany({
    where: { articleId: id },
    orderBy: { versionNumber: 'desc' },
  })
  return NextResponse.json({ ok: true, versions })
}

/**
 * POST /api/admin/articles/[id]/version
 * Buat snapshot manual versi baru. `content` field menyimpan **markdown source**
 * (bukan HTML) supaya restore bisa set langsung ke Article.contentMarkdown.
 * Versi juga mengupdate artikel.content (HTML render) agar konsisten.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const article = await db.article.findUnique({ where: { id } })
  if (!article) {
    return NextResponse.json({ ok: false, message: 'Artikel tidak ditemukan.' }, { status: 404 })
  }

  let body: VersionBody = {}
  try {
    body = await req.json()
  } catch {
    /* body opsional */
  }

  const title =
    typeof body.title === 'string' && body.title.trim()
      ? body.title.trim()
      : article.title
  const md =
    typeof body.contentMarkdown === 'string' ? body.contentMarkdown : article.contentMarkdown ?? ''
  const excerpt =
    typeof body.excerpt === 'string' ? body.excerpt : article.excerpt ?? ''
  const editNote =
    typeof body.editNote === 'string' && body.editNote.trim()
      ? body.editNote.trim()
      : 'Snapshot manual'

  const last = await db.articleVersion.findFirst({
    where: { articleId: id },
    orderBy: { versionNumber: 'desc' },
    select: { versionNumber: true },
  })
  const nextVer = (last?.versionNumber ?? 0) + 1

  // Simpan MARKDOWN di version.content
  const version = await db.articleVersion.create({
    data: {
      articleId: id,
      versionNumber: nextVer,
      title,
      content: md,
      excerpt,
      editedBy: 'admin',
      editNote,
    },
  })

  // Update artikel agar konsisten dengan snapshot terbaru
  const contentHtml = renderMarkdownToHtml(md)
  await db.article.update({
    where: { id },
    data: {
      content: contentHtml,
      contentMarkdown: md,
      wordCount: calculateWordCount(md),
      readingTimeMinutes: calculateReadingTime(md),
    },
  })

  return NextResponse.json({ ok: true, versionNumber: version.versionNumber })
}
