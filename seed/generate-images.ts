/**
 * Task ID: M5+M7 — Generate 40 featured images, upload to Supabase Storage,
 * and update Article.featuredImageUrl in the database.
 *
 * Hybrid strategy per article:
 *   1. Web image search via Z-AI in-house service
 *      (zai.images.search.create) — returns OSS-hosted URLs that are
 *      guaranteed reachable. Fast, free, no rate-limit quota issue.
 *   2. Download candidate image (try up to 3 results in order).
 *   3. Fallback to AI image generation (zai.images.generations.create)
 *      if no search hit is usable.
 *   4. Resize to 1200×675 (16:9) with sharp, output WebP @ q=80.
 *   5. Upload to Supabase Storage bucket `articles-featured/{slug}.webp`.
 *   6. Update Article.featuredImageUrl with the public CDN URL.
 *
 * Idempotent / resumable:
 *   - Before processing an article, check if `{slug}.webp` already exists
 *     in the bucket. If yes, skip fetching/processing and just update DB.
 *   - All failures are non-fatal: a single failed article is logged and
 *     skipped; processing continues with the rest.
 *
 * Rate-limit handling:
 *   - 3.5 s pause between image-search calls.
 *   - 12 s pause between AI image generations.
 *   - After every 10 articles, an extra 20 s cooldown.
 *
 * Env override:
 *   The sandbox exposes a *system* DATABASE_URL pointing to legacy SQLite.
 *   Bun prioritises system env over `.env`, so we parse `.env` manually and
 *   force `process.env.DATABASE_URL` before instantiating the Prisma client.
 *
 * Run with:
 *   bun run seed/generate-images.ts
 *
 * Optional env vars:
 *   LIMIT=N          Process only the first N articles (debugging).
 *   ONLY=slug1,slug2 Process only the listed slugs (comma-separated).
 *   SKIP_EXISTING=0  Re-process even if .webp already exists in bucket.
 *   AI_ONLY=1        Skip image search, go straight to AI generation.
 */
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import ZAI from 'z-ai-web-dev-sdk'

// ---------------------------------------------------------------------------
// Env bootstrap (sandbox override workaround)
// ---------------------------------------------------------------------------
const PROJECT_ROOT = '/home/z/my-project'
const ENV_FILE = path.join(PROJECT_ROOT, '.env')

function loadEnvFile(): Record<string, string> {
  const vars: Record<string, string> = {}
  if (!fs.existsSync(ENV_FILE)) return vars
  const text = fs.readFileSync(ENV_FILE, 'utf-8')
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const match = /^([A-Z_][A-Z0-9_]*)\s*=\s*"?(.+?)"?\s*$/.exec(line)
    if (match) {
      const value = match[2].split(/\s+#/)[0]
      vars[match[1]] = value
    }
  }
  return vars
}

const envVars = loadEnvFile()

// Force DATABASE_URL — sandbox system env still points at the SQLite file.
const SUPABASE_DB_URL =
  envVars.DATABASE_URL ||
  'postgresql://postgres.dxtxpobdnskdfqmlskyv:Peredam%40bangku101@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?connection_limit=1'
process.env.DATABASE_URL = SUPABASE_DB_URL.includes('connection_limit')
  ? SUPABASE_DB_URL
  : SUPABASE_DB_URL + (SUPABASE_DB_URL.includes('?') ? '&' : '?') + 'connection_limit=1'

const SUPABASE_URL = envVars.SUPABASE_URL || ''
const SUPABASE_SECRET_KEY = envVars.SUPABASE_SECRET_KEY || ''
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('❌ Missing SUPABASE_URL / SUPABASE_SECRET_KEY in .env')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Tunables
// ---------------------------------------------------------------------------
const BUCKET = 'articles-featured'
const TARGET_WIDTH = 1200
const TARGET_HEIGHT = 675 // 16:9
const WEBP_QUALITY = 80
const SEARCH_DELAY_MS = 3500 // between image-search calls
const AI_DELAY_MS = 12000 // between AI image generations
const BATCH_COOLDOWN_MS = 20000 // every BATCH_SIZE articles
const BATCH_SIZE = 10
const TMP_DIR = '/tmp/article-images'
const PROGRESS_FILE = path.join(PROJECT_ROOT, 'seed/data/image-gen-progress.json')
const LOG_FILE = path.join(PROJECT_ROOT, 'seed/data/image-gen-log.json')

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------
const prisma = new PrismaClient({ log: ['warn', 'error'] })
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

interface ArticleRow {
  id: string
  slug: string
  title: string
  excerpt: string | null
  categoryId: string
  category: { slug: string; name: string } | null
  featuredImageUrl: string | null
  tags: { slug: string; name: string }[]
}

interface ProgressEntry {
  slug: string
  source: 'search' | 'ai'
  searchQuery?: string
  originUrl?: string
  storagePath: string
  publicUrl: string
  bytes: number
  width: number
  height: number
  durationMs: number
}

interface LogEntry {
  slug: string
  title: string
  status: 'ok' | 'skip' | 'fail' | 'error'
  reason?: string
  source?: 'search' | 'ai'
  bytes?: number
  durationMs?: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

function buildSearchQuery(article: ArticleRow): string {
  // Strategy: use a cleaned, queryable fragment of the title.
  // For car-specific articles (slug starts with `peredam-mobil-{brand}`),
  // inject the brand name explicitly to improve image-search recall.
  const title = article.title.trim()
  const slug = article.slug

  // Detect car brand from slug (peredam-mobil-agya, peredam-mobil-br-v, ...)
  const brandMatch = /^peredam-mobil-([a-z0-9-]+)$/.exec(slug)
  if (brandMatch) {
    const brand = brandMatch[1]
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
    // e.g. "Toyota Agya interior door panel" — searches tend to need brand
    return `Toyota ${brand} mobil interior`
  }

  // Generic: take first 5 words of the title as a phrase
  const words = title.split(/\s+/).slice(0, 5).join(' ')
  // Add "mobil jakarta" context to bias results toward automotive workshop
  // imagery rather than abstract blog illustrations.
  return `${words} mobil jakarta`
}

function buildAiPrompt(article: ArticleRow): string {
  const title = article.title.trim()
  const excerpt = (article.excerpt || '').trim().slice(0, 120)
  // Keep the prompt concise — the model handles Indonesian better than
  // long English narratives for car-themed scenes.
  return [
    `Editorial automotive photograph for an article titled "${title}".`,
    excerpt ? `Topic: ${excerpt}.` : '',
    'Setting: a Jakarta car audio & soundproofing workshop — interior, warm lighting,',
    'realistic detail, no people faces, no readable text, no watermark, no logo.',
    'Composition: 16:9 aspect ratio, professional magazine quality.',
  ]
    .filter(Boolean)
    .join(' ')
}

function loadProgress(): Record<string, ProgressEntry> {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'))
    }
  } catch (err) {
    console.warn('Could not parse progress file:', err)
  }
  return {}
}

function saveProgress(map: Record<string, ProgressEntry>) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(map, null, 2))
}

function appendLog(entry: LogEntry) {
  const log: LogEntry[] = fs.existsSync(LOG_FILE)
    ? (() => {
        try {
          return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8')) as LogEntry[]
        } catch {
          return []
        }
      })()
    : []
  log.push(entry)
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2))
}

/** Check whether `{slug}.webp` already exists in the bucket. */
async function storageObjectExists(key: string): Promise<boolean> {
  // list() with prefix matching is the recommended way to check existence.
  const { data, error } = await supabase.storage.from(BUCKET).list('', {
    search: key,
    limit: 1,
  })
  if (error) return false
  return (data || []).some((item) => item.name === key)
}

/** Download a remote image into a Buffer. Returns null on any failure. */
async function downloadImage(url: string, timeoutMs = 15000): Promise<Buffer | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Some CDNs require a UA. Use a generic browser-like one.
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        Accept: 'image/*,*/*;q=0.8',
      },
      redirect: 'follow',
    })
    clearTimeout(timer)
    if (!resp.ok) return null
    const contentType = resp.headers.get('content-type') || ''
    if (!/^image\//i.test(contentType) && !/\.(png|jpe?g|webp|avif|gif)$/i.test(url)) {
      return null
    }
    const buf = Buffer.from(await resp.arrayBuffer())
    if (buf.length < 2048) return null // too small, likely a 1x1 spacer
    if (buf.length > 30 * 1024 * 1024) return null // too large
    return buf
  } catch {
    return null
  }
}

/** Resize + convert to 1200x675 WebP using sharp. Returns Buffer. */
async function processImage(input: Buffer): Promise<{ buf: Buffer; width: number; height: number }> {
  // Use sharp's metadata to read the source dimensions (validate it is a real image).
  const meta = await sharp(input).metadata()
  if (!meta.width || !meta.height) {
    throw new Error('Input is not a valid image')
  }
  const buf = await sharp(input)
    .resize(TARGET_WIDTH, TARGET_HEIGHT, {
      // cover = crop-to-fit, maintains aspect ratio without distortion.
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: false,
    })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer()
  return { buf, width: TARGET_WIDTH, height: TARGET_HEIGHT }
}

/** Try web image search → download → process. Returns processed buffer + meta, or null. */
async function tryWebSearch(
  zai: ZAI,
  article: ArticleRow,
): Promise<{ buf: Buffer; originUrl: string; query: string } | null> {
  const query = buildSearchQuery(article)
  try {
    const resp = await zai.images.search.create({ query, count: 4, gl: 'us', rank: false })
    const results = (resp && resp.results) || []
    if (results.length === 0) return null
    for (const item of results) {
      const url = item.original_url
      if (!url) continue
      const raw = await downloadImage(url)
      if (!raw) continue
      try {
        const processed = await processImage(raw)
        return { buf: processed.buf, originUrl: url, query }
      } catch (err) {
        // sharp failed — try next candidate
        console.log(`    ↳ sharp decode failed for ${url}: ${(err as Error).message}`)
        continue
      }
    }
  } catch (err) {
    console.log(`    ↳ image-search error: ${(err as Error).message}`)
  }
  return null
}

/** Generate image via Z-AI image generation. Returns processed buffer or null. */
async function tryAiGenerate(
  zai: ZAI,
  article: ArticleRow,
): Promise<{ buf: Buffer } | null> {
  const prompt = buildAiPrompt(article)
  try {
    const resp = await zai.images.generations.create({
      prompt,
      size: '1344x768', // closest available to 16:9 (1.75 vs 1.778)
    })
    const data = resp && resp.data
    if (!data || data.length === 0) return null
    const base64 = data[0].base64
    if (!base64) return null
    const raw = Buffer.from(base64, 'base64')
    const processed = await processImage(raw)
    return { buf: processed.buf }
  } catch (err) {
    console.log(`    ↳ AI generation error: ${(err as Error).message}`)
    return null
  }
}

/** Upload WebP buffer to Supabase Storage. Returns public URL. */
async function uploadToStorage(
  slug: string,
  webpBuf: Buffer,
): Promise<{ storagePath: string; publicUrl: string }> {
  const storagePath = `${slug}.webp`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, webpBuf, {
      contentType: 'image/webp',
      cacheControl: 'public,max-age=31536000,immutable',
      upsert: true,
    })
  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }
  const publicUrl = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${storagePath}`
  return { storagePath, publicUrl }
}

/** Update Article.featuredImageUrl in DB. */
async function updateDbRow(articleId: string, publicUrl: string): Promise<void> {
  await prisma.article.update({
    where: { id: articleId },
    data: { featuredImageUrl: publicUrl },
  })
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('════════════════════════════════════════════════════════════')
  console.log('  M5+M7 — Generate & Upload Featured Images to Supabase')
  console.log('════════════════════════════════════════════════════════════')
  console.log(`  Supabase URL : ${SUPABASE_URL}`)
  console.log(`  Bucket       : ${BUCKET}`)
  console.log(`  Target       : ${TARGET_WIDTH}×${TARGET_HEIGHT} WebP q=${WEBP_QUALITY}`)
  console.log(`  DB URL       : ${process.env.DATABASE_URL!.replace(/:[^:@]+@/, ':***@')}`)
  console.log('──────────────────────────────────────────────────────────')

  fs.mkdirSync(TMP_DIR, { recursive: true })

  console.log('Initializing ZAI SDK...')
  const zai = await ZAI.create()
  console.log('ZAI SDK ready\n')

  const articles: ArticleRow[] = await prisma.article.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      categoryId: true,
      featuredImageUrl: true,
      category: { select: { slug: true, name: true } },
      tags: { select: { slug: true, name: true } },
    },
    orderBy: { publishedAt: 'asc' },
  })
  console.log(`Loaded ${articles.length} articles from DB\n`)

  // Optional filters via env vars (debugging)
  const limit = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : 0
  const onlySet = process.env.ONLY
    ? new Set(process.env.ONLY.split(',').map((s) => s.trim()).filter(Boolean))
    : null
  const skipExisting = (process.env.SKIP_EXISTING ?? '1') !== '0'
  const aiOnly = process.env.AI_ONLY === '1'

  const progress = loadProgress()
  let countOk = 0
  let countSkip = 0
  let countFail = 0
  let countAi = 0
  let countSearch = 0

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i]
    const idx = i + 1
    const tag = `[${String(idx).padStart(2, '0')}/${String(articles.length).padStart(2, '0')}]`
    const startedAt = Date.now()

    if (limit && idx > limit) {
      console.log(`${tag} ${article.slug} — skipping (LIMIT=${limit})`)
      break
    }
    if (onlySet && !onlySet.has(article.slug)) {
      continue
    }

    console.log(`\n${tag} ${article.slug}`)
    console.log(`    Title: ${article.title}`)

    // Resume check
    const storageKey = `${article.slug}.webp`
    if (skipExisting && (progress[article.slug] || (await storageObjectExists(storageKey)))) {
      const existing = progress[article.slug]
      if (existing) {
        // Make sure DB is also synced
        if (article.featuredImageUrl !== existing.publicUrl) {
          await updateDbRow(article.id, existing.publicUrl)
        }
        console.log(`    ↳ skip (already processed: ${existing.source}, ${fmtBytes(existing.bytes)})`)
        countSkip++
        appendLog({
          slug: article.slug,
          title: article.title,
          status: 'skip',
          reason: 'already-in-progress-map',
          source: existing.source,
          bytes: existing.bytes,
        })
        continue
      }
      // File exists in storage but not in progress map — re-use by building URL
      const publicUrl = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${storageKey}`
      await updateDbRow(article.id, publicUrl)
      progress[article.slug] = {
        slug: article.slug,
        source: 'search',
        storagePath: storageKey,
        publicUrl,
        bytes: 0,
        width: TARGET_WIDTH,
        height: TARGET_HEIGHT,
        durationMs: 0,
      }
      saveProgress(progress)
      console.log(`    ↳ skip (file exists in bucket, DB synced)`)
      countSkip++
      appendLog({
        slug: article.slug,
        title: article.title,
        status: 'skip',
        reason: 'exists-in-bucket',
      })
      continue
    }

    // Try image search first (unless AI_ONLY)
    let processed: { buf: Buffer; source: 'search' | 'ai'; originUrl?: string; searchQuery?: string } | null = null
    if (!aiOnly) {
      console.log(`    → searching: "${buildSearchQuery(article)}"`)
      const searchHit = await tryWebSearch(zai, article)
      if (searchHit) {
        processed = {
          buf: searchHit.buf,
          source: 'search',
          originUrl: searchHit.originUrl,
          searchQuery: searchHit.query,
        }
        console.log(`    ✓ web-search hit: ${searchHit.originUrl}`)
      }
    }

    // Fallback to AI generation
    if (!processed) {
      console.log(`    → falling back to AI generation...`)
      await sleep(AI_DELAY_MS) // longer pause before AI call (rate-limit friendly)
      const aiHit = await tryAiGenerate(zai, article)
      if (aiHit) {
        processed = { buf: aiHit.buf, source: 'ai' }
        console.log(`    ✓ AI image generated (${fmtBytes(aiHit.buf.length)})`)
      }
    }

    if (!processed) {
      console.log(`    ✗ no usable image — skipping`)
      countFail++
      appendLog({
        slug: article.slug,
        title: article.title,
        status: 'fail',
        reason: 'no-search-or-ai-success',
      })
      // Extra cooldown after a fail
      await sleep(SEARCH_DELAY_MS)
      continue
    }

    // Upload
    try {
      const { storagePath, publicUrl } = await uploadToStorage(article.slug, processed.buf)
      await updateDbRow(article.id, publicUrl)
      const durationMs = Date.now() - startedAt
      progress[article.slug] = {
        slug: article.slug,
        source: processed.source,
        searchQuery: processed.searchQuery,
        originUrl: processed.originUrl,
        storagePath,
        publicUrl,
        bytes: processed.buf.length,
        width: TARGET_WIDTH,
        height: TARGET_HEIGHT,
        durationMs,
      }
      saveProgress(progress)
      if (processed.source === 'search') countSearch++
      else countAi++
      countOk++
      console.log(
        `    ✓ uploaded ${fmtBytes(processed.buf.length)} → ${publicUrl} (${(durationMs / 1000).toFixed(1)}s)`,
      )
      appendLog({
        slug: article.slug,
        title: article.title,
        status: 'ok',
        source: processed.source,
        bytes: processed.buf.length,
        durationMs,
      })
    } catch (err) {
      console.log(`    ✗ upload failed: ${(err as Error).message}`)
      countFail++
      appendLog({
        slug: article.slug,
        title: article.title,
        status: 'error',
        reason: (err as Error).message,
      })
    }

    // Rate-limit pacing
    if (processed.source === 'search') {
      await sleep(SEARCH_DELAY_MS)
    } else {
      await sleep(AI_DELAY_MS)
    }
    if (idx % BATCH_SIZE === 0 && idx < articles.length) {
      console.log(`\n  ── cooldown ${BATCH_COOLDOWN_MS / 1000}s after ${idx} articles ──\n`)
      await sleep(BATCH_COOLDOWN_MS)
    }
  }

  console.log('\n════════════════════════════════════════════════════════════')
  console.log('  Summary')
  console.log('──────────────────────────────────────────────────────────')
  console.log(`  Total articles : ${articles.length}`)
  console.log(`  OK (web search): ${countSearch}`)
  console.log(`  OK (AI gen)    : ${countAi}`)
  console.log(`  Skipped (exist): ${countSkip}`)
  console.log(`  Failed         : ${countFail}`)
  console.log(`  Total processed: ${countOk}`)
  console.log('════════════════════════════════════════════════════════════')

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
