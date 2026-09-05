import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import { requireAdmin } from '@/lib/auth'

export const runtime = 'nodejs'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'articles')

/**
 * POST /api/admin/upload
 * Upload featured image (multipart form-data, field "file").
 * Resize ke 1200x675 (16:9) via sharp. Simpan ke /public/uploads/articles/.
 * Return { url }.
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
    return NextResponse.json({ ok: false, message: 'File tidak ditemukan (field "file").' }, { status: 400 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ ok: false, message: 'Hanya file gambar yang diperbolehkan.' }, { status: 400 })
  }
  // Limit 8 MB
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ ok: false, message: 'Ukuran gambar maksimal 8 MB.' }, { status: 400 })
  }

  const buf = Buffer.from(await file.arrayBuffer())
  // Pastikan direktori uploads/articles ada
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.jpg`
  const filepath = path.join(UPLOAD_DIR, filename)

  try {
    // Resize & convert ke JPEG 16:9 1200x675, cover (crop) supaya pas.
    await sharp(buf)
      .resize(1200, 675, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 82, progressive: true })
      .toFile(filepath)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, message: `Gagal memproses gambar: ${msg}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true, url: `/uploads/articles/${filename}` })
}
