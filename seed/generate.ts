/**
 * Generate 10 new articles using ZAI LLM (glm-4.6)
 * Each article gets a strict JSON schema response.
 *
 * Usage: bun run seed/generate.ts
 *
 * Output: /home/z/my-project/seed/data/generated_{1..10}.json
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
  source: 'ai'
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
}

interface TopicSpec {
  topic: string
  category: string // category slug
  relatedTags: string[]
}

const TOPICS: TopicSpec[] = [
  {
    topic:
      'Cara Memilih Workshop Peredam Mobil Premium vs Ekonomis di Jakarta Selatan',
    category: 'review-workshop',
    relatedTags: ['jakarta-selatan', 'uji-kebisingan', 'biaya-peredam'],
  },
  {
    topic: 'Material Peredam Mobil Import vs Lokal: Apa yang Layak Dibeli',
    category: 'peredam-mobil',
    relatedTags: ['butyl', 'foam-absorber', 'mass-loaded-vinyl'],
  },
  {
    topic: 'Pengaruh Peredam Mobil terhadap Resale Value Mobil Bekas',
    category: 'tips-biaya',
    relatedTags: ['biaya-peredam', 'peredam-pintu'],
  },
  {
    topic:
      'Road Test: Cara Mengukur Kebisingan Kabin Sebelum dan Sesudah Peredam',
    category: 'review-workshop',
    relatedTags: ['uji-kebisingan', 'wheel-housing'],
  },
  {
    topic: 'Peredam Mobil untuk Mobil Listrik (EV): Apakah Berbeda?',
    category: 'peredam-mobil',
    relatedTags: ['butyl', 'foam-absorber', 'uji-kebisingan'],
  },
  {
    topic:
      'Budget 5 Juta: Paket Peredam dan Audio Entry-Level Terbaik untuk Mobil Harian',
    category: 'tips-biaya',
    relatedTags: ['biaya-peredam', 'speaker-split', 'peredam-pintu'],
  },
  {
    topic:
      'Berapa Lama Umur Material Peredam Mobil? Tanda-tanda Harus Diganti',
    category: 'peredam-mobil',
    relatedTags: ['butyl', 'mass-loaded-vinyl', 'peredam-pintu'],
  },
  {
    topic: 'Garansi Workshop Peredam: Apa yang Sebenarnya Dicakup',
    category: 'review-workshop',
    relatedTags: ['biaya-peredam', 'jakarta-selatan'],
  },
  {
    topic:
      'Urutan Membongkar Trim Mobil untuk Pemasangan Peredam yang Aman',
    category: 'peredam-mobil',
    relatedTags: ['peredam-pintu', 'butyl', 'foam-absorber'],
  },
  {
    topic:
      'Audio Setup vs Peredam: Mana yang Sebaiknya Didahulukan untuk Mobil Jaketan',
    category: 'upgrade-audio',
    relatedTags: ['dsp', 'speaker-split', 'peredam-pintu'],
  },
]

const SYSTEM_PROMPT = `Anda adalah editor untuk portal media "Peredam Mobil Jakarta" (https://peredammobiljakarta.com).
Anda menulis artikel bahasa Indonesia untuk pembaca pemilik mobil di Jakarta yang tertarik
peredam mobil dan upgrade audio. Tone: informatif, kredibel, ringkas, tidak jargon berlebihan.
Penulis: Innovation Car Audio. Gaya heading singkat dan padat. Hindari pujian berlebihan ke brand.
Hindari klaim iklan. Selipkan 1-2 angka konkret (Rp, mm, persen, dB) bila masuk akal.
Pakai Bahasa Indonesia baku, hindari "Anda" berulang — boleh pakai orang kedua/jamak.

Format JSON WAJIB:
{
  "title": "...",                          // judul artikel, 50-90 karakter
  "excerpt": "...",                         // 1-2 kalimat ringkasan, 120-200 karakter
  "contentHtml": "...",                    // HTML body, 300-500 kata
  "tags": ["tag1","tag2","tag3"]            // 2-3 tag tanpa #, sudah slug-format kebababase
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
Contoh tag: "butyl", "foam-absorber", "peredam-pintu", "uji-kebisingan", "biaya-peredam".

Hanya keluarkan JSON valid. Jangan tambahkan teks sebelum atau sesudah JSON.
Jangan bungkus dengan markdown code fence.`

function userPromptFor(t: TopicSpec): string {
  return `Tulis artikel bahasa Indonesia untuk portal media "Peredam Mobil Jakarta" dengan topik:
${t.topic}

Kategori artikel: ${t.category}
Tag yang relevan (boleh dipakai semuanya atau sebagian): ${t.relatedTags.join(', ')}

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
  // Strip markdown code fence if present
  let s = raw.trim()
  // Find first { and last }
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
  // Tags: array of strings, or comma-separated string
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
  // Word count
  const text = stripHtml(a.contentHtml)
  const words = text.split(/\s+/).filter(Boolean).length
  if (words < 280) errs.push(`contentHtml only ${words} words (need >=280)`)
  // Check forbidden tags
  const forbidden = /<(h1|img|script|style|iframe|a)\b/i
  if (forbidden.test(a.contentHtml)) errs.push('contentHtml has forbidden tags')
  // Ensure tags is array of strings
  if (a.tags && !a.tags.every((t) => typeof t === 'string')) {
    a.tags = a.tags.map((t) => String(t))
  }
  return errs
}

async function generateOne(
  zai: ZAI,
  ordinal: number,
  spec: TopicSpec,
): Promise<NormalizedGenerated> {
  console.log(`[gen] #${ordinal} topic: ${spec.topic}`)
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
  const slug = slugify(title)
  const text = stripHtml(generated.contentHtml)
  const wordCount = text.split(/\s+/).filter(Boolean).length
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200))
  const publishedAt = new Date().toISOString()
  // Random view count 150-2800 — bias toward lower
  const viewCount = Math.floor(150 + Math.pow(Math.random(), 1.6) * 2650)
  const tags = (generated.tags || [])
    .map((t) => slugify(t))
    .filter(Boolean)
    .slice(0, 3)
  return {
    source: 'ai',
    ordinal,
    title,
    slug,
    category: spec.category,
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
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  console.log('Initializing ZAI SDK...')
  const zai = await ZAI.create()
  console.log('ZAI SDK ready')
  const results: NormalizedGenerated[] = []
  for (let i = 0; i < TOPICS.length; i++) {
    const spec = TOPICS[i]
    const ordinal = i + 1
    const a = await generateOne(zai, ordinal, spec)
    const out = path.join(OUT_DIR, `generated_${ordinal}.json`)
    await writeFile(out, JSON.stringify(a, null, 2), 'utf8')
    console.log(
      `[ok] #${ordinal} ${a.slug} | cat=${a.category} | words=${a.wordCount} | tags=[${a.tags.join(', ')}]`,
    )
    results.push(a)
    // small delay to avoid rate limit
    await new Promise((r) => setTimeout(r, 2500))
  }
  console.log(`\nGenerated ${results.length}/${TOPICS.length} articles`)
  const cats = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1
    return acc
  }, {})
  console.log('Category distribution:', cats)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
