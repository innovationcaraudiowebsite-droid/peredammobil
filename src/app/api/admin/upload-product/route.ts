import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

import { requireAdminApi } from '@/lib/auth'
import { getSupabaseAdmin, publicStorageUrl, BUCKETS } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const CACHE_CTRL = 'public,max-age=31536000,immutable'

/**
 * POST /api/admin/upload-product
 * Upload gambar produk (field "file", multipart form-data).
 * Resize max 800×800 (preserve aspect), convert ke WebP q=82.
 * Upload ke Supabase Storage bucket `site-assets` folder `products/`.
 * Return { ok, url } untuk dipakai di form produk.
 */
export async function POST(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

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

  let uploadBuf: Buffer
  let contentType: string
  try {
    uploadBuf = await sharp(buf, { failOn: 'none' })
      .rotate() // auto-rotate based on EXIF
      .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
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

  const filename = `products/product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`

  const { error } = await getSupabaseAdmin().storage
    .from(BUCKETS.SITE_ASSETS)
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

  return NextResponse.json({ ok: true, url: publicStorageUrl(BUCKETS.SITE_ASSETS, filename) })
}
