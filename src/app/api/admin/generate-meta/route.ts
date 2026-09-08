import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

import { requireAdmin } from '@/lib/auth'

export const runtime = 'nodejs'

interface GenMetaBody {
  title?: unknown
  excerpt?: unknown
  content?: unknown
}

function asString(v: unknown, max = 6000): string {
  if (typeof v !== 'string') return ''
  return v.slice(0, max)
}

/**
 * POST /api/admin/generate-meta
 * Body: { title, excerpt, content } → return { metaDescription }
 *
 * Pakai z-ai-web-dev-sdk LLM `glm-4.6` untuk meringkas konten menjadi
 * meta description 120-160 char (cocok untuk SEO Google).
 */
export async function POST(req: NextRequest) {
  await requireAdmin()

  let body: GenMetaBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Body tidak valid.' }, { status: 400 })
  }

  const title = asString(body.title, 200)
  const excerpt = asString(body.excerpt, 1000)
  // content bisa markdown; potong ke ~3000 char supaya prompt tidak kebanyakan
  const content = asString(body.content, 3000)

  if (!title && !excerpt && !content) {
    return NextResponse.json(
      { ok: false, message: 'Setidaknya salah satu dari title/excerpt/content wajib diisi.' },
      { status: 400 },
    )
  }

  const systemPrompt =
    'Anda asisten SEO untuk portal berita otomotif. Tugas: tulis meta description dalam Bahasa Indonesia. ' +
    'Aturan ketat: 120-160 karakter, natural, deskriptif, hindari clickbait, JANGAN ulangi judul, ' +
    'fokus pada manfaat/fakta utama. Output HANYA teks meta description (tanpa prefix, tanpa tanda kutip).'

  const userPrompt = `Judul: ${title}\n\nRingkasan singkat: ${excerpt}\n\nKonten artikel (mungkin terpotong):\n${content}`

  try {
    const zai = await ZAI.create()
    const resp = await zai.chat.completions.create({
      model: 'glm-4.6',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const text: string = resp?.choices?.[0]?.message?.content ?? ''
    if (!text) {
      return NextResponse.json(
        { ok: false, message: 'AI tidak mengembalikan teks. Coba lagi.' },
        { status: 502 },
      )
    }
    // Clean up: hapus tanda kutip pembungkus bila ada, trim.
    const cleaned = text
      .trim()
      .replace(/^["'\u201c\u201d]+|["'\u201c\u201d]+$/g, '')
      .replace(/\s+/g, ' ')
      .slice(0, 200)
    return NextResponse.json({ ok: true, metaDescription: cleaned })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { ok: false, message: `Gagal generate meta description: ${msg}` },
      { status: 500 },
    )
  }
}
