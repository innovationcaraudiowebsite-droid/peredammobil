import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import { requireAdmin } from '@/lib/auth'

export const runtime = 'nodejs'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'inline')

/**
 * POST /api/admin/upload-inline
 * Upload image inline dari MDX editor (field "file", multipart form-data).
 * Resize max 1600px (preserve aspect), simpan ke /public/uploads/inline/.
 * Return { url } yang akan di-embed di markdown sebagai ![](url).
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
    return NextResponse.json({ ok: false, message: 'Hanya file gambar yang diperbolehkan.' }, { status: 400 })
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ ok: false, message: 'Ukuran gambar maksimal 8 MB.' }, { status: 400 })
  }

  const buf = Buffer.from(await file.arrayBuffer())
  await fs.mkdir(UPLOAD_DIR, { recursive: true })

  // Tentukan ekstensi output berdasarkan tipe MIME input
  const isPng = file.type === 'image/png'
  const isWebp = file.type === 'image/webp'
  const isGif = file.type === 'image/gif'
  const ext = isPng ? 'png' : isWebp ? 'webp' : isGif ? 'gif' : 'jpg'
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`
  const filepath = path.join(UPLOAD_DIR, filename)

  try {
    if (isGif) {
      // GIF: simpan apa adanya (preserve animasi)
      await fs.writeFile(filepath, buf)
    } else {
      // Resize max-width 1600px, preserve aspect
      const pipeline = sharp(buf, { failOn: 'none' })
        .rotate() // auto-rotate based on EXIF
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })

      if (isPng) {
        await pipeline.png({ quality: 90, compressionLevel: 9 }).toFile(filepath)
      } else if (isWebp) {
        await pipeline.webp({ quality: 82 }).toFile(filepath)
      } else {
        await pipeline.jpeg({ quality: 82, progressive: true }).toFile(filepath)
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, message: `Gagal memproses gambar: ${msg}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true, url: `/uploads/inline/${filename}` })
}
