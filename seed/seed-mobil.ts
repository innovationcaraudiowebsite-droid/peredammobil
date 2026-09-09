/**
 * Seed 10 mobil-types articles into DB.
 *
 * Loads JSON files matching `mobil-*.json` from /seed/data and upserts each one
 * to the DB (status=PUBLISHED, slug=`peredam-mobil-{brand}` for stable URL).
 *
 * Idempotent: existing articles with same slug are updated.
 *
 * Usage: bun run seed/seed-mobil.ts
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

interface NormalizedArticle {
  source: 'ai-mobil'
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
  targetKeyword: string
}

const DATA_DIR = path.resolve(process.cwd(), 'seed/data')

function buildContentMarkdown(html: string): string {
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
  md = md.replace(/<[^>]+>/g, '')
  md = md
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
  md = md.replace(/\n{3,}/g, '\n\n').trim()
  return md
}

async function loadMobilArticles(): Promise<NormalizedArticle[]> {
  const files = (await readdir(DATA_DIR))
    .filter((f) => f.startsWith('mobil-') && f.endsWith('.json'))
    .sort()
  const out: NormalizedArticle[] = []
  for (const f of files) {
    const raw = await readFile(path.join(DATA_DIR, f), 'utf8')
    out.push(JSON.parse(raw))
  }
  console.log(`Loaded ${out.length} mobil-types articles`)
  return out
}

async function main() {
  console.log('=== Seeding mobil-types articles ===\n')

  const articles = await loadMobilArticles()
  let created = 0
  let updated = 0

  // Pre-upsert all tags referenced by these articles.
  const allTags = new Set<string>()
  for (const a of articles) for (const t of a.tags) allTags.add(t)
  for (const tagSlug of allTags) {
    await db.tag.upsert({
      where: { slug: tagSlug },
      update: { name: tagSlug },
      create: { name: tagSlug, slug: tagSlug },
    })
  }
  console.log(`   ${allTags.size} unique tags upserted`)

  for (const a of articles) {
    const cat = await db.category.findUnique({ where: { slug: a.category } })
    if (!cat) {
      console.warn(`[warn] category "${a.category}" not found for article ${a.slug}`)
      continue
    }
    const publishedAt = a.publishedAt ? new Date(a.publishedAt) : new Date()
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
          isFeatured: false,
          isBreaking: false,
          metaTitle,
          metaDescription,
          metaKeywords,
          ogImageUrl: a.featuredImageUrl,
          targetKeyword: a.targetKeyword || null,
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
          isFeatured: false,
          isBreaking: false,
          metaTitle,
          metaDescription,
          metaKeywords,
          ogImageUrl: a.featuredImageUrl,
          targetKeyword: a.targetKeyword || null,
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
    console.log(`   [ok] ${a.slug} | kw="${a.targetKeyword}" | words=${a.wordCount}`)
  }

  console.log(`\n=== Seed complete: ${created} created, ${updated} updated ===`)
  const total = await db.article.count()
  console.log(`Total articles in DB: ${total}`)
}

main()
  .catch((e) => {
    console.error('[seed-mobil error]', e)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
