/**
 * Generate 10 mobil-types articles using ZAI LLM (glm-4.6).
 *
 * Output: /home/z/my-project/seed/data/mobil-{slug}.json
 *
 * Each article targets one popular car model in Jakarta.
 *
 * Usage: bun run seed/generate-mobil-types.ts
 */
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import ZAI from 'z-ai-web-dev-sdk'

const OUT_DIR = path.resolve(process.cwd(), 'seed/data')

interface GeneratedArticle {
  title: string
  excerpt: string
  contentHtml: string
  tags: string[]
}

interface NormalizedGenerated extends GeneratedArticle {
  source: 'ai-mobil'
  ordinal: number
  slug: string
  category: string
  authorName: string
  publishedAt: string
  readingTimeMinutes: number
  wordCount: number
  viewCount: number
  originalUrl: null
  metaDescription: string
  metaKeywords: null
  featuredImageUrl: null
  targetKeyword: string
}

interface MobilSpec {
  brand: string
  topic: string
  relatedTags: string[]
  targetKeyword: string
}

const MOBIL_SPECS: MobilSpec[] = [
  {
    brand: 'Agya',
    topic: 'Peredam Mobil Agya: Paket Hemat untuk Harian Jakarta',
    relatedTags: ['agya', 'peredam-pintu', 'biaya-peredam'],
    targetKeyword: 'peredam mobil agya',
  },
  {
    brand: 'Avanza',
    topic: 'Peredam Mobil Avanza: Paket Recommended untuk Keluarga',
    relatedTags: ['avanza', 'butyl', 'biaya-peredam'],
    targetKeyword: 'peredam mobil avanza',
  },
  {
    brand: 'HRV',
    topic: 'Peredam Mobil HRV: Tuning Audio Premium dengan Budget Pas',
    relatedTags: ['hrv', 'speaker-split', 'dsp'],
    targetKeyword: 'peredam mobil hrv',
  },
  {
    brand: 'Brio',
    topic: 'Peredam Mobil Brio: Solusi Kabin Senyap Hatchback',
    relatedTags: ['brio', 'foam-absorber', 'peredam-pintu'],
    targetKeyword: 'peredam mobil brio',
  },
  {
    brand: 'Innova',
    topic: 'Peredam Mobil Innova: Comfort untuk Diesel Noisy',
    relatedTags: ['innova', 'wheel-housing', 'mass-loaded-vinyl'],
    targetKeyword: 'peredam mobil innova',
  },
  {
    brand: 'Jazz',
    topic: 'Peredam Mobil Jazz: Tuning Audio Hatchback Sporty',
    relatedTags: ['jazz', 'speaker-split', 'peredam-pintu'],
    targetKeyword: 'peredam mobil jazz',
  },
  {
    brand: 'Xpander',
    topic: 'Peredam Mobil Xpander: Kabin Senyap untuk Keluarga MVP',
    relatedTags: ['xpander', 'butyl', 'foam-absorber'],
    targetKeyword: 'peredam mobil xpander',
  },
  {
    brand: 'Terios',
    topic: 'Peredam Mobil Terios: Road Noise Solution untuk SUV',
    relatedTags: ['terios', 'wheel-housing', 'uji-kebisingan'],
    targetKeyword: 'peredam mobil terios',
  },
  {
    brand: 'Calya',
    topic: 'Peredam Mobil Calya: Paket Entry-Level yang Terasa',
    relatedTags: ['calya', 'biaya-peredam', 'peredam-pintu'],
    targetKeyword: 'peredam mobil calya',
  },
  {
    brand: 'BR-V',
    topic: 'Peredam Mobil BR-V: SUV Senyap untuk Harian dan Travel',
    relatedTags: ['br-v', 'wheel-housing', 'butyl'],
    targetKeyword: 'peredam mobil br-v',
  },
]

const SYSTEM_PROMPT = `Anda adalah editor untuk portal media "Peredam Mobil Jakarta" (https://peredammobiljakarta.com).
Anda menulis artikel bahasa Indonesia untuk pembaca pemilik mobil di Jakarta yang tertarik
peredam mobil dan upgrade audio. Tone: informatif, kredibel, ringkas, tidak jargon berlebihan.
Penulis: Innovation Car Audio. Gaya heading singkat dan padat. Hindari pujian berlebihan ke brand.
Hindari klaim iklan. Selipkan 1-2 angka konkret (Rp, mm, persen, dB) bila masuk akal.
Pakai Bahasa Indonesia baku.

Format JSON WAJIB:
{
  "title": "...",                          // judul artikel, 50-90 karakter
  "excerpt": "...",                         // 1-2 kalimat ringkasan, 120-200 karakter
  "contentHtml": "...",                    // HTML body, 400-600 kata
  "tags": ["tag1","tag2","tag3"]            // 2-3 tag tanpa #, sudah slug-format kebabase
}

Aturan contentHtml:
- Mulai dengan satu paragraf <p> pendek (lead/intro 3-4 kalimat yang memaparkan masalah)
- Lanjut dengan TEPAT 5 sub-bab dengan <h2>...</h2> masing-masing diikuti 1-2 paragraf <p>
- Setiap sub-bab HARUS berisi minimal 60 kata. Jangan ringkas terlalu pendek.
- Boleh pakai satu <ul><li>...</li></ul> atau <ol><li>...</li></ol> di salah satu sub-bab
- Boleh pakai <strong> untuk emphasis
- Tutup dengan satu paragraf <p> kesimpulan 3-4 kalimat
- Total WAJIB 400-600 kata (target ideal 500). Jangan kurang dari 400.
- TIDAK boleh ada <h1>, <img>, <script>, <style>, <iframe>, <a>
- TIDAK boleh pakai Markdown — hanya HTML murni
- TIDAK boleh ada newlines di dalam tag, boleh ada newlines antar tag untuk readability

tags: array 2-3 string tanpa #, sudah slug-format kebabase (huruf kecil, dipisah "-").

Hanya keluarkan JSON valid. Jangan tambahkan teks sebelum atau sesudah JSON.
Jangan bungkus dengan markdown code fence.`

function userPromptFor(spec: MobilSpec): string {
  return `Tulis artikel bahasa Indonesia untuk portal media "Peredam Mobil Jakarta" dengan topik:
${spec.topic}

Kategori artikel: peredam-mobil
Brand mobil: ${spec.brand}
Tag yang relevan (boleh dipakai semuanya atau sebagian): ${spec.relatedTags.join(', ')}

Konteks: Pembaca adalah pemilik ${spec.brand} di Jakarta yang ingin mengurangi kebisingan kabin
untuk harian dan travel. Bahas material peredam yang sesuai (butyl / foam / MLV), area aplikasi
utama (pintu, lantai, wheel housing), perkiraan biaya (Rp), dan tips memilih workshop Jakarta.

Keluarkan dalam format JSON yang sudah ditentukan. Pastikan JSON valid & parse-able.`
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function extractJson(raw: string): GeneratedArticle {
  let s = raw.trim()
  const first = s.indexOf('{')
  const last = s.lastIndexOf('}')
  if (first === -1 || last === -1) {
    throw new Error(`No JSON object found in LLM response: ${s.slice(0, 200)}...`)
  }
  s = s.slice(first, last + 1)
  return JSON.parse(s)
}

function validate(a: GeneratedArticle): string[] {
  const errs: string[] = []
  if (!a.title || a.title.length < 10) errs.push('title too short')
  if (!a.excerpt || a.excerpt.length < 40) errs.push('excerpt too short')
  if (!a.contentHtml || a.contentHtml.length < 100) errs.push('contentHtml too short')
  if (!Array.isArray(a.tags)) {
    if (typeof a.tags === 'string') {
      a.tags = (a.tags as string)
        .split(/[,|]/)
        .map((t) => t.trim().replace(/^#/, '').toLowerCase())
        .filter(Boolean)
    } else {
      errs.push('tags not array')
    }
  }
  const text = stripHtml(a.contentHtml)
  const words = text.split(/\s+/).filter(Boolean).length
  if (words < 280) errs.push(`contentHtml only ${words} words (need >=280)`)
  const forbidden = /<(h1|img|script|style|iframe|a)\b/i
  if (forbidden.test(a.contentHtml)) errs.push('contentHtml has forbidden tags')
  if (a.tags && !a.tags.every((t) => typeof t === 'string')) {
    a.tags = a.tags.map((t) => String(t))
  }
  return errs
}

async function generateOne(
  zai: ZAI,
  ordinal: number,
  spec: MobilSpec,
): Promise<NormalizedGenerated> {
  console.log(`[gen-mobil] #${ordinal} brand=${spec.brand} topic: ${spec.topic}`)
  let attempt = 0
  let generated: GeneratedArticle | null = null
  while (attempt < 3) {
    attempt++
    try {
      const resp = await zai.chat.completions.create({
        model: 'glm-4.6',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPromptFor(spec) },
        ],
        thinking: { type: 'disabled' },
      })
      const content = resp?.choices?.[0]?.message?.content ?? ''
      if (!content) throw new Error('empty response')
      generated = extractJson(content)
      const errs = validate(generated)
      if (errs.length) {
        console.warn(`[warn] #${ordinal} attempt ${attempt} validation: ${errs.join('; ')}`)
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 3000))
          continue
        }
      }
      break
    } catch (e: any) {
      console.warn(`[warn] #${ordinal} attempt ${attempt} error: ${e?.message ?? e}`)
      await new Promise((r) => setTimeout(r, 5000))
    }
  }
  if (!generated) throw new Error(`Failed to generate article #${ordinal}`)

  const title = generated.title.trim()
  // Brand-aware slug for stable file naming & URL.
  const slug = `peredam-mobil-${slugify(spec.brand)}`
  const text = stripHtml(generated.contentHtml)
  const wordCount = text.split(/\s+/).filter(Boolean).length
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200))
  const publishedAt = new Date().toISOString()
  // Random view count 150-1500 (bias toward lower).
  const viewCount = Math.floor(150 + Math.pow(Math.random(), 1.6) * 1350)
  const tags = (generated.tags || [])
    .map((t) => slugify(t))
    .filter(Boolean)
    .slice(0, 3)
  return {
    source: 'ai-mobil',
    ordinal,
    title,
    slug,
    category: 'peredam-mobil',
    excerpt: generated.excerpt.trim(),
    contentHtml: generated.contentHtml.trim(),
    tags,
    authorName: 'Innovation Car Audio',
    publishedAt,
    readingTimeMinutes,
    wordCount,
    viewCount,
    originalUrl: null,
    metaDescription: generated.excerpt.trim().slice(0, 200),
    metaKeywords: null,
    featuredImageUrl: null,
    targetKeyword: spec.targetKeyword,
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  console.log('Initializing ZAI SDK...')
  const zai = await ZAI.create()
  console.log('ZAI SDK ready')
  const results: NormalizedGenerated[] = []
  for (let i = 0; i < MOBIL_SPECS.length; i++) {
    const spec = MOBIL_SPECS[i]
    const ordinal = i + 1
    const a = await generateOne(zai, ordinal, spec)
    const out = path.join(OUT_DIR, `mobil-${a.slug}.json`)
    await writeFile(out, JSON.stringify(a, null, 2), 'utf8')
    console.log(
      `[ok] #${ordinal} ${a.slug} | words=${a.wordCount} | tags=[${a.tags.join(', ')}] | kw="${a.targetKeyword}"`,
    )
    results.push(a)
    await new Promise((r) => setTimeout(r, 2500))
  }
  console.log(`\nGenerated ${results.length}/${MOBIL_SPECS.length} mobil-types articles`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
