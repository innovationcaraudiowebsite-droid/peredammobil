import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import { requireAdmin } from '@/lib/auth'

export const runtime = 'nodejs'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'site')

/**
 * POST /api/admin/upload-logo
 * Upload logo (multipart form-data, field "file"). Resize 512x512 (fit inside, preserve aspect).
 * Simpan PNG ke /public/uploads/site/. Return { url }.
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
  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json({ ok: false, message: 'Ukuran logo maksimal 4 MB.' }, { status: 400 })
  }

  const buf = Buffer.from(await file.arrayBuffer())
  await fs.mkdir(UPLOAD_DIR, { recursive: true })

  // Pakai PNG untuk logo (preserve transparency) — resize 512x512 fit-inside
  const filename = `logo-${Date.now()}-${randomUUID().slice(0, 8)}.png`
  const filepath = path.join(UPLOAD_DIR, filename)

  try {
    await sharp(buf, { failOn: 'none' })
      .rotate() // EXIF auto-rotate
      .resize({
        width: 512,
        height: 512,
        fit: 'inside',
        withoutEnlargement: true,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(filepath)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { ok: false, message: `Gagal memproses logo: ${msg}` },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, url: `/uploads/site/${filename}` })
}
