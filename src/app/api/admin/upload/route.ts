import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin, publicStorageUrl, BUCKETS } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const CACHE_CTRL = 'public,max-age=31536000,immutable'

/**
 * POST /api/admin/upload
 * Upload featured image (multipart form-data, field "file").
 * Resize ke 1200×675 (16:9) via sharp cover-crop, convert to WebP q=80.
 * Upload ke Supabase Storage bucket `articles-featured`.
 * Return { ok, url } — `url` adalah public CDN URL Supabase.
 */
export async function POST(req: NextRequest) {
  await requireAdmin()

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ ok: false, message: 'FormData tidak valid.' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, message: 'File tidak ditemukan (field "file").' },
      { status: 400 },
    )
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json(
      { ok: false, message: 'Hanya file gambar yang diperbolehkan.' },
      { status: 400 },
    )
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ ok: false, message: 'Ukuran gambar maksimal 8 MB.' }, { status: 400 })
  }

  const buf = Buffer.from(await file.arrayBuffer())

  let resized: Buffer
  try {
    resized = await sharp(buf)
      .rotate() // EXIF auto-rotate
      .resize(1200, 675, { fit: 'cover', position: 'attention' })
      .webp({ quality: 80 })
      .toBuffer()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { ok: false, message: `Gagal memproses gambar: ${msg}` },
      { status: 500 },
    )
  }

  const filename = `article-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`

  const { error } = await supabaseAdmin.storage
    .from(BUCKETS.ARTICLES_FEATURED)
    .upload(filename, resized, {
      contentType: 'image/webp',
      cacheControl: CACHE_CTRL,
      upsert: false,
    })

  if (error) {
    return NextResponse.json(
      { ok: false, message: `Gagal upload ke Supabase Storage: ${error.message}` },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, url: publicStorageUrl(BUCKETS.ARTICLES_FEATURED, filename) })
}
