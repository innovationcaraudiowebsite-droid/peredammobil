/**
 * Seed Prisma database for "Peredam Mobil Jakarta" portal.
 *
 * - 4 Categories (Peredam Mobil, Upgrade Audio, Review Workshop, Tips & Biaya)
 * - SiteSetting singleton (id="global")
 * - Tags (deduped across all articles)
 * - 30 Articles (20 scraped + 10 AI-generated) with PUBLISHED status
 * - 10 FAQ entries (scraped from homepage)
 *
 * Idempotent: uses upsert on unique fields (slug, name, email, etc.).
 * Usage: bun run seed/seed.ts
 */
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

interface NormalizedArticle {
  source: 'scrape' | 'ai'
  ordinal: number
  title: string
  slug: string
  category: string
  excerpt: string
  contentHtml: string
  authorName: string
  featuredImageUrl: string | null
  publishedAt: string | null
  readingTimeMinutes: number
  wordCount: number
  viewCount: number
  tags: string[]
  originalUrl: string | null
  metaDescription: string
  metaKeywords: string | null
}

interface FaqEntry {
  question: string
  answer: string
}

const DATA_DIR = path.resolve(process.cwd(), 'seed/data')

// ===== Category definitions =====
const CATEGORIES = [
  {
    name: 'Peredam Mobil',
    slug: 'peredam-mobil',
    description:
      'Panduan teknis pemasangan peredam pada pintu, lantai, atap, kap mesin, firewall, dan wheel housing — material, urutan lapisan, serta kesalahan yang paling sering terjadi.',
    color: 'amber',
    order: 1,
  },
  {
    name: 'Upgrade Audio',
    slug: 'upgrade-audio',
    description:
      'Panduan upgrade audio mobil: speaker split vs coaxial, power amplifier, DSP, subwoofer, dan head unit. Berbasis pengalaman nyata di kabin mobil harian Jakarta.',
    color: 'red',
    order: 2,
  },
  {
    name: 'Review Workshop',
    slug: 'review-workshop',
    description:
      'Cara menilai workshop peredam mobil di Jakarta sebelum menyerahkan kunci. Standar uji kebisingan, sebaran lokasi, dan ciri-ciri workshop yang patut dihindari.',
    color: 'slate',
    order: 3,
  },
  {
    name: 'Tips & Biaya',
    slug: 'tips-biaya',
    description:
      'Kalkulasi biaya pasang peredam mobil di Jakarta, strategi anggaran bertahap vs paket full, checklist sebelum pengerjaan, dan mitos-mitos yang masih banyak dipercaya.',
    color: 'emerald',
    order: 4,
  },
]

// ===== SiteSetting singleton =====
const SITE_SETTING = {
  id: 'global',
  siteName: 'Peredam Mobil Jakarta',
  tagline: 'Review Workshop Peredam & Upgrade Audio Terbaik',
  logoUrl: 'https://peredammobiljakarta.com/public/assets/img/logo.svg',
  faviconUrl: 'https://peredammobiljakarta.com/public/assets/img/favicon.svg',
  contactEmail: 'innovationcaraudio@gmail.com',
  contactAddress:
    'Jl. Taman Surya Boulevard 3 Blok H1 No.9, Pegadungan, Kalideres, Jakarta Barat 11830',
  contactPhone: null,
  socialFacebook: null,
  socialInstagram: null,
  socialYoutube: null,
  authorName: 'Innovation Car Audio',
  newsletterHeadline: 'Buletin Mingguan',
  newsletterSubtext:
    'Ringkasan review workshop dan panduan peredam, sekali seminggu langsung di inbox Anda.',
  footerCopyright: '© 2026 Peredam Mobil Jakarta. Seluruh hak cipta dilindungi.',
  primaryColor: 'amber',
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

async function loadArticles(): Promise<NormalizedArticle[]> {
  const scrapedFiles = (await readdir(DATA_DIR))
    .filter((f) => f.startsWith('scraped_') && f.endsWith('.json'))
    .sort((a, b) => {
      const na = parseInt(a.match(/scraped_(\d+)/)?.[1] || '0', 10)
      const nb = parseInt(b.match(/scraped_(\d+)/)?.[1] || '0', 10)
      return na - nb
    })
  const genFiles = (await readdir(DATA_DIR))
    .filter((f) => f.startsWith('generated_') && f.endsWith('.json'))
    .sort((a, b) => {
      const na = parseInt(a.match(/generated_(\d+)/)?.[1] || '0', 10)
      const nb = parseInt(b.match(/generated_(\d+)/)?.[1] || '0', 10)
      return na - nb
    })
  const scraped: NormalizedArticle[] = []
  for (const f of scrapedFiles) {
    const raw = await readFile(path.join(DATA_DIR, f), 'utf8')
    scraped.push(JSON.parse(raw))
  }
  const generated: NormalizedArticle[] = []
  for (const f of genFiles) {
    const raw = await readFile(path.join(DATA_DIR, f), 'utf8')
    generated.push(JSON.parse(raw))
  }
  console.log(`Loaded ${scraped.length} scraped + ${generated.length} generated articles`)
  return [...scraped, ...generated]
}

async function loadFaqs(): Promise<FaqEntry[]> {
  const fp = path.join(DATA_DIR, 'faq.json')
  try {
    const raw = await readFile(fp, 'utf8')
    return JSON.parse(raw)
  } catch {
    console.warn(`[warn] no faq.json found at ${fp}`)
    return []
  }
}

function buildContentMarkdown(html: string): string {
  // Convert minimal HTML to markdown for contentMarkdown field.
  // (Used for re-edit in MDX editor.)
  let md = html
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/g, (_, t) => `# ${t.trim()}\n\n`)
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, (_, t) => `## ${t.trim()}\n\n`)
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, (_, t) => `### ${t.trim()}\n\n`)
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/g, (_, t) => `${t.trim()}\n\n`)
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/g, (_, t) => `**${t.trim()}**`)
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/g, (_, t) => `*${t.trim()}*`)
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/g, (_, body) =>
    body.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, (_, t) => `- ${t.trim()}\n`).trim() + '\n\n',
  )
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/g, (_, body) => {
    let i = 1
    return (
      body.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, (_, t) => `${i++}. ${t.trim()}\n`).trim() + '\n\n'
    )
  })
  md = md.replace(/<br\s*\/?>/g, '\n')
  // Strip remaining tags
  md = md.replace(/<[^>]+>/g, '')
  // Decode entities
  md = md
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
  // Collapse multiple newlines
  md = md.replace(/\n{3,}/g, '\n\n').trim()
  return md
}

async function main() {
  console.log('=== Seeding Peredam Mobil Jakarta DB ===\n')

  // ----- 1. Categories -----
  console.log('[1/5] Upserting categories...')
  for (const c of CATEGORIES) {
    await db.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, color: c.color, order: c.order },
      create: c,
    })
  }
  const categoryCount = await db.category.count()
  console.log(`   -> ${categoryCount} categories`)

  // ----- 2. SiteSetting -----
  console.log('[2/5] Upserting SiteSetting singleton...')
  await db.siteSetting.upsert({
    where: { id: 'global' },
    update: SITE_SETTING,
    create: SITE_SETTING,
  })
  const ss = await db.siteSetting.findUnique({ where: { id: 'global' } })
  console.log(`   -> SiteSetting id=${ss?.id} siteName="${ss?.siteName}"`)

  // ----- 3. Articles & Tags -----
  console.log('[3/5] Upserting articles + tags...')
  const articles = await loadArticles()
  // Featured: top 3 scraped by view count
  const featuredSlugs = new Set(
    articles
      .filter((a) => a.source === 'scrape')
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 3)
      .map((a) => a.slug),
  )

  // Build unique tag list across all articles
  const allTags = new Set<string>()
  for (const a of articles) {
    for (const t of a.tags) allTags.add(t)
  }
  // Insert tags (by slug)
  for (const tagSlug of allTags) {
    await db.tag.upsert({
      where: { slug: tagSlug },
      update: { name: tagSlug },
      create: { name: tagSlug, slug: tagSlug },
    })
  }
  console.log(`   -> ${allTags.size} unique tags upserted`)

  // Upsert articles
  let created = 0
  let updated = 0
  for (const a of articles) {
    const cat = await db.category.findUnique({ where: { slug: a.category } })
    if (!cat) {
      console.warn(`[warn] category "${a.category}" not found for article ${a.slug}`)
      continue
    }
    const publishedAt = a.publishedAt ? new Date(a.publishedAt) : new Date()
    const isFeatured = featuredSlugs.has(a.slug)
    const contentMarkdown = buildContentMarkdown(a.contentHtml)
    const metaTitle = a.title.slice(0, 70)
    const metaDescription = (a.metaDescription || a.excerpt || '').slice(0, 200)
    const metaKeywords = a.metaKeywords || null

    const existing = await db.article.findUnique({ where: { slug: a.slug } })
    if (existing) {
      await db.article.update({
        where: { slug: a.slug },
        data: {
          title: a.title,
          excerpt: a.excerpt,
          content: a.contentHtml,
          contentMarkdown,
          featuredImageUrl: a.featuredImageUrl,
          featuredImageAlt: a.featuredImageUrl ? a.title : null,
          categoryId: cat.id,
          authorName: a.authorName,
          status: 'PUBLISHED',
          isFeatured,
          isBreaking: false,
          metaTitle,
          metaDescription,
          metaKeywords,
          ogImageUrl: a.featuredImageUrl,
          readingTimeMinutes: a.readingTimeMinutes,
          wordCount: a.wordCount,
          viewCount: a.viewCount,
          shareCount: Math.floor(a.viewCount * 0.04),
          publishedAt,
          tags: {
            set: [],
            connect: a.tags.map((slug) => ({ slug })),
          },
        },
      })
      updated++
    } else {
      await db.article.create({
        data: {
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt,
          content: a.contentHtml,
          contentMarkdown,
          featuredImageUrl: a.featuredImageUrl,
          featuredImageAlt: a.featuredImageUrl ? a.title : null,
          categoryId: cat.id,
          authorName: a.authorName,
          status: 'PUBLISHED',
          isFeatured,
          isBreaking: false,
          metaTitle,
          metaDescription,
          metaKeywords,
          ogImageUrl: a.featuredImageUrl,
          readingTimeMinutes: a.readingTimeMinutes,
          wordCount: a.wordCount,
          viewCount: a.viewCount,
          shareCount: Math.floor(a.viewCount * 0.04),
          publishedAt,
          tags: {
            connect: a.tags.map((slug) => ({ slug })),
          },
        },
      })
      created++
    }
  }
  console.log(`   -> ${created} created, ${updated} updated`)

  // ----- 4. FAQ -----
  console.log('[4/5] Upserting FAQs...')
  const faqs = await loadFaqs()
  // Delete existing FAQs (since we have no unique key besides id), then recreate
  await db.faq.deleteMany({})
  for (let i = 0; i < faqs.length; i++) {
    await db.faq.create({
      data: {
        question: faqs[i].question,
        answer: faqs[i].answer,
        order: i + 1,
        isPublished: true,
      },
    })
  }
  console.log(`   -> ${faqs.length} FAQs inserted`)

  // ----- 5. Summary -----
  console.log('[5/5] Final counts:')
  const totalArticles = await db.article.count()
  const publishedArticles = await db.article.count({ where: { status: 'PUBLISHED' } })
  const totalCategories = await db.category.count()
  const totalTags = await db.tag.count()
  const totalFaqs = await db.faq.count()
  const featured = await db.article.findMany({
    where: { isFeatured: true },
    select: { slug: true, title: true, viewCount: true },
  })
  console.log(`   Articles: ${totalArticles} (${publishedArticles} PUBLISHED)`)
  console.log(`   Categories: ${totalCategories}`)
  console.log(`   Tags: ${totalTags}`)
  console.log(`   FAQs: ${totalFaqs}`)
  console.log(`   Featured (${featured.length}):`)
  for (const f of featured) {
    console.log(`     - [${f.slug}] ${f.title} (${f.viewCount} views)`)
  }
  console.log('\n=== Seed complete ===')
}

main()
  .catch((e) => {
    console.error('[seed error]', e)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
