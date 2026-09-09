import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin, publicStorageUrl, BUCKETS } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const CACHE_CTRL = 'public,max-age=31536000,immutable'

/**
 * POST /api/admin/upload-inline
 * Upload image inline dari MDX editor (field "file", multipart form-data).
 * Resize max 1600×900 (preserve aspect), convert ke WebP q=82.
 * Upload ke Supabase Storage bucket `articles-inline`.
 * Return { ok, url } yang akan di-embed di markdown sebagai ![](url).
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
    return NextResponse.json({ ok: false, message: 'File tidak ditemukan.' }, { status: 400 })
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

  // GIF animasi tidak bisa di-resize oleh sharp tanpa kehilangan frame —
  // simpan apa adanya kalau GIF.
  let uploadBuf: Buffer
  let contentType: string
  if (file.type === 'image/gif') {
    uploadBuf = buf
    contentType = 'image/gif'
  } else {
    try {
      uploadBuf = await sharp(buf, { failOn: 'none' })
        .rotate() // auto-rotate based on EXIF
        .resize({ width: 1600, height: 900, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer()
      contentType = 'image/webp'
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return NextResponse.json(
        { ok: false, message: `Gagal memproses gambar: ${msg}` },
        { status: 500 },
      )
    }
  }

  const ext = contentType === 'image/gif' ? 'gif' : 'webp'
  const filename = `inline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabaseAdmin.storage
    .from(BUCKETS.ARTICLES_INLINE)
    .upload(filename, uploadBuf, {
      contentType,
      cacheControl: CACHE_CTRL,
      upsert: false,
    })

  if (error) {
    return NextResponse.json(
      { ok: false, message: `Gagal upload ke Supabase Storage: ${error.message}` },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, url: publicStorageUrl(BUCKETS.ARTICLES_INLINE, filename) })
}
