/**
 * Parse scraped articles from z-ai page_reader JSON output
 * into normalized article JSON for seeding.
 *
 * Usage: bun run seed/parse-scraped.ts
 *
 * Input:  /tmp/perdam_articles/article_{1..20}.json
 * Output: /home/z/my-project/seed/data/scraped_{1..20}.json
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

interface ScrapedJson {
  code: number
  data: {
    title: string
    description: string
    html: string
    publishedTime?: string
    url: string
  }
}

interface NormalizedArticle {
  source: 'scrape'
  ordinal: number
  title: string
  slug: string
  category: string // category slug
  excerpt: string
  contentHtml: string // article body only
  authorName: string
  featuredImageUrl: string | null
  publishedAt: string | null // ISO date string
  readingTimeMinutes: number
  wordCount: number
  viewCount: number
  tags: string[] // raw tag names without #
  originalUrl: string
  metaDescription: string
  metaKeywords: string | null
}

const SCRAPE_DIR = '/tmp/perdam_articles'
const OUT_DIR = path.resolve(process.cwd(), 'seed/data')

// Map URL path segment -> category slug
const CATEGORY_FROM_URL = {
  'peredam-mobil': 'peredam-mobil',
  'upgrade-audio': 'upgrade-audio',
  'review-workshop': 'review-workshop',
  'tips-biaya': 'tips-biaya',
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

function extractFromArticleContent(html: string): { body: string; tags: string[] } {
  // Find article-content block, end before share-row or article-tags
  const startMatch = html.match(/class="article-content"\s*>/)
  if (!startMatch || startMatch.index === undefined) {
    return { body: '', tags: [] }
  }
  const startIdx = startMatch.index
  // Find tags block
  const tagsMatch = html.match(/<div class="article-tags">([\s\S]*?)<\/div>/)
  let tagsBlock = ''
  let tagsEndIdx: number | null = null
  if (tagsMatch && tagsMatch.index !== undefined) {
    tagsBlock = tagsMatch[1]
    tagsEndIdx = tagsMatch.index + tagsMatch[0].length
  }
  // End body before article-tags or share-row, whichever first
  const endMarkers = ['<div class="article-tags"', '<div class="share-row"']
  let endIdx = html.length
  for (const marker of endMarkers) {
    const idx = html.indexOf(marker, startIdx)
    if (idx !== -1 && idx < endIdx) endIdx = idx
  }
  let body = html.slice(startIdx, endIdx)
  // Strip leading `class="article-content">` open tag
  body = body.replace(/^class="article-content"\s*>/, '').trim()
  // Strip trailing whitespace and stray closing tags
  body = body.replace(/\s*<\/div>\s*$/, '').trim()

  // Tags
  const tagMatches = [...tagsBlock.matchAll(/#([A-Za-z0-9][A-Za-z0-9\s\-+]*?)<\/a>/g)]
  const tags = tagMatches.map((m) => m[1].trim()).filter(Boolean)

  return { body, tags }
}

function extractViewCount(html: string): number {
  // Pattern: <span><i class="bi bi-eye"...></i> 206 kali dibaca</span>
  const m = html.match(/(\d[\d.]*)\s*kali dibaca/)
  if (!m) return Math.floor(100 + Math.random() * 3400)
  const n = parseInt(m[1].replace(/\./g, ''), 10)
  return isNaN(n) ? Math.floor(100 + Math.random() * 3400) : n
}

function extractReadingTime(html: string): number | null {
  const m = html.match(/(\d+)\s*menit baca/)
  return m ? parseInt(m[1], 10) : null
}

function extractJsonLd(html: string): any[] {
  const matches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  const out: any[] = []
  for (const m of matches) {
    try {
      out.push(JSON.parse(m[1]))
    } catch {
      // skip
    }
  }
  return out
}

function extractMetaKeywords(html: string): string | null {
  const m = html.match(/<meta name="keywords" content="([^"]+)"/)
  return m ? m[1] : null
}

async function parseOne(ordinal: number): Promise<NormalizedArticle | null> {
  const fp = path.join(SCRAPE_DIR, `article_${ordinal}.json`)
  if (!existsSync(fp)) {
    console.warn(`[warn] missing scrape JSON for #${ordinal}: ${fp}`)
    return null
  }
  const raw = await readFile(fp, 'utf8')
  const json: ScrapedJson = JSON.parse(raw)
  const data = json.data
  if (!data || !data.html) {
    console.warn(`[warn] article #${ordinal} missing data.html`)
    return null
  }
  const html = data.html

  // URL-derived fields
  const url = data.url
  const urlObj = new URL(url)
  const pathParts = urlObj.pathname.split('/').filter(Boolean)
  // Expected: ['berita', '<category>', '<slug>']
  let category = 'peredam-mobil'
  let slug = `article-${ordinal}`
  if (pathParts.length >= 3 && pathParts[0] === 'berita') {
    category = pathParts[1]
    slug = pathParts[2]
  }

  // JSON-LD
  const ld = extractJsonLd(html)
  const newsArticle = ld.find((b) => b['@type'] === 'NewsArticle') || {}

  // Body & tags
  const { body, tags } = extractFromArticleContent(html)

  // Word count from text
  const text = stripHtml(body)
  const words = text.split(/\s+/).filter(Boolean).length
  const wordCount = words

  // Reading time
  let readingTimeMinutes = extractReadingTime(html) ?? Math.max(1, Math.ceil(words / 200))

  // View count
  const viewCount = extractViewCount(html)

  // PublishedAt: prefer JSON-LD, then publishedTime, then null
  let publishedAt: string | null = null
  if (newsArticle.datePublished) publishedAt = newsArticle.datePublished
  else if (data.publishedTime) publishedAt = data.publishedTime
  else publishedAt = null

  // Author
  const authorName = newsArticle?.author?.name || 'Innovation Car Audio'

  // Featured image URL from JSON-LD
  let featuredImageUrl: string | null = null
  if (newsArticle?.image?.url) featuredImageUrl = newsArticle.image.url

  // Meta description & keywords
  const metaDescription = data.description?.trim() || ''
  const metaKeywords = extractMetaKeywords(html)

  // Title — prefer NewsArticle headline, then data.title
  const title = (newsArticle?.headline || data.title || `Artikel ${ordinal}`).trim()

  // Excerpt — use meta description (1-2 sentences, already short)
  const excerpt = (metaDescription || '').trim().slice(0, 280)

  return {
    source: 'scrape',
    ordinal,
    title,
    slug,
    category,
    excerpt,
    contentHtml: body,
    authorName,
    featuredImageUrl,
    publishedAt,
    readingTimeMinutes,
    wordCount,
    viewCount,
    tags: tags.map(slugify),
    originalUrl: url,
    metaDescription,
    metaKeywords,
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const results: NormalizedArticle[] = []
  for (let i = 1; i <= 20; i++) {
    const a = await parseOne(i)
    if (a) {
      const out = path.join(OUT_DIR, `scraped_${i}.json`)
      await writeFile(out, JSON.stringify(a, null, 2), 'utf8')
      console.log(
        `[ok] #${i} ${a.slug} | cat=${a.category} | words=${a.wordCount} | views=${a.viewCount} | tags=[${a.tags.join(', ')}] | published=${a.publishedAt}`,
      )
      results.push(a)
    } else {
      console.warn(`[fail] #${i}`)
    }
  }
  console.log(`\nParsed ${results.length}/20 articles`)
  // Sanity: ensure unique slugs
  const slugs = results.map((r) => r.slug)
  const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i)
  if (dupes.length) console.warn('Duplicate slugs:', dupes)
  // Sanity: category distribution
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
