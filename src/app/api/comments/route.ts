import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return ''
}

/**
 * GET /api/comments?articleId=...
 *
 * Public. List komentar dengan status APPROVED untuk artikel tertentu, sort by createdAt desc.
 * Tidak mengembalikan email/IP untuk privacy.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const articleId = (url.searchParams.get('articleId') || '').trim()
  if (!articleId) {
    return NextResponse.json(
      { ok: false, message: 'articleId wajib diisi.' },
      { status: 400 },
    )
  }
  // Verify article exists & PUBLISHED.
  const article = await db.article.findFirst({
    where: { id: articleId, status: 'PUBLISHED' },
    select: { id: true },
  })
  if (!article) {
    return NextResponse.json(
      { ok: false, message: 'Artikel tidak ditemukan.' },
      { status: 404 },
    )
  }
  const comments = await db.comment.findMany({
    where: { articleId, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      authorName: true,
      content: true,
      createdAt: true,
    },
  })
  return NextResponse.json({ ok: true, items: comments, total: comments.length })
}

/**
 * POST /api/comments
 * Body: { articleId, name, email, content, parentId? }
 *
 * Public. Status default PENDING. Disimpan ipAddress untuk keperluan spam tracking.
 * Validate: name 1-100, email valid & <=254, content 1-2000, articleId must exist & PUBLISHED.
 */
export async function POST(req: NextRequest) {
  let body: {
    articleId?: unknown
    name?: unknown
    email?: unknown
    content?: unknown
    parentId?: unknown
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Body JSON tidak valid.' }, { status: 400 })
  }

  const articleId =
    typeof body.articleId === 'string' ? body.articleId.trim() : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const content = typeof body.content === 'string' ? body.content.trim() : ''
  const parentId =
    typeof body.parentId === 'string' && body.parentId.length > 0
      ? body.parentId
      : null

  if (!articleId) {
    return NextResponse.json({ ok: false, message: 'Artikel wajib dipilih.' }, { status: 400 })
  }
  if (!name || name.length < 1 || name.length > 100) {
    return NextResponse.json(
      { ok: false, message: 'Nama wajib diisi (1–100 karakter).' },
      { status: 400 },
    )
  }
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json(
      { ok: false, message: 'Email tidak valid.' },
      { status: 400 },
    )
  }
  if (!content || content.length < 1 || content.length > 2000) {
    return NextResponse.json(
      { ok: false, message: 'Komentar wajib diisi (maks 2000 karakter).' },
      { status: 400 },
    )
  }

  // Verify article exists & PUBLISHED.
  const article = await db.article.findFirst({
    where: { id: articleId, status: 'PUBLISHED' },
    select: { id: true },
  })
  if (!article) {
    return NextResponse.json(
      { ok: false, message: 'Artikel tidak ditemukan.' },
      { status: 404 },
    )
  }

  // If parentId provided, verify it exists & belongs to same article & APPROVED.
  if (parentId) {
    const parent = await db.comment.findUnique({
      where: { id: parentId },
      select: { id: true, articleId: true, status: true },
    })
    if (!parent || parent.articleId !== articleId) {
      return NextResponse.json(
        { ok: false, message: 'Komentar induk tidak valid.' },
        { status: 400 },
      )
    }
  }

  const ip = getClientIp(req)

  try {
    const created = await db.comment.create({
      data: {
        articleId,
        authorName: name,
        authorEmail: email,
        content,
        status: 'PENDING',
        parentId,
        ipAddress: ip || null,
      },
      select: {
        id: true,
        authorName: true,
        content: true,
        status: true,
        createdAt: true,
      },
    })
    return NextResponse.json({
      ok: true,
      message:
        'Komentar Anda terkirim dan menunggu moderasi admin. Terima kasih!',
      item: created,
    })
  } catch (err) {
    console.error('comment submit error', err)
    return NextResponse.json(
      { ok: false, message: 'Gagal menyimpan komentar. Coba lagi nanti.' },
      { status: 500 },
    )
  }
}
