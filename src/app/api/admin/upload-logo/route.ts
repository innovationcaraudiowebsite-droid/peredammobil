import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

import { requireAdminApi } from '@/lib/auth'
import { getSupabaseAdmin, publicStorageUrl, BUCKETS } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const CACHE_CTRL = 'public,max-age=31536000,immutable'

/**
 * POST /api/admin/upload-logo
 * Upload logo (multipart form-data, field "file").
 * Resize ke 512×512 (fit-inside, preserve aspect), composite on white background
 * kalau ada transparency, convert ke PNG.
 * Upload ke Supabase Storage bucket `site-assets`.
 * Return { ok, url }.
 */
export async function POST(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

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
  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json({ ok: false, message: 'Ukuran logo maksimal 4 MB.' }, { status: 400 })
  }

  const buf = Buffer.from(await file.arrayBuffer())

  let processed: Buffer
  try {
    // Resize fit-inside 512×512, lalu composite di atas background putih 512×512
    // supaya transparency (PNG alpha) tidak jadi transparan di output PNG yang
    // bisa kelihatan jelek di latar gelap.
    processed = await sharp(buf, { failOn: 'none' })
      .rotate() // EXIF auto-rotate
      .resize({
        width: 512,
        height: 512,
        fit: 'inside',
        withoutEnlargement: true,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .flatten({ background: { r: 255, g: 255, b: 255 } }) // flatten alpha ke putih
      .png({ quality: 90, compressionLevel: 9 })
      .toBuffer()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { ok: false, message: `Gagal memproses logo: ${msg}` },
      { status: 500 },
    )
  }

  const filename = `logo-${Date.now()}.png`

  const { error } = await getSupabaseAdmin().storage
    .from(BUCKETS.SITE_ASSETS)
    .upload(filename, processed, {
      contentType: 'image/png',
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
