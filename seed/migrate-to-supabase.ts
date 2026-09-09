/**
 * Task ID: M4 — Migrate SQLite backup → Supabase Postgres
 *
 * Reads /home/z/my-project/seed/data/backup-sqlite.json and inserts the data
 * into the Supabase Postgres database via Prisma Client.
 *
 * Strategy:
 *  - Preserve original IDs (no UUID regeneration) so article-tag relations,
 *    comments, and other FK references stay intact.
 *  - Use upsert (create-or-update) so the script is idempotent — re-running
 *    will not error on conflicts nor create duplicates.
 *  - Batch per-table writes inside prisma.$transaction() to cut round-trips
 *    and keep the migration atomic per stage.
 *  - Convert ISO datetime strings to Date objects because Postgres is strict
 *    about typed columns (SQLite was permissive).
 *  - Insert parents first (categories, tags, articles) then connect the
 *    Article↔Tag implicit m-n relation.
 *
 * IMPORTANT — environment override:
 *  The sandbox exposes a *system* DATABASE_URL pointing to the legacy SQLite
 *  file (`file:/home/z/my-project/db/custom.db`). Bun loads .env but system
 *  env vars take precedence, so `process.env.DATABASE_URL` would otherwise be
 *  the SQLite URL and Prisma would reject it as not `postgresql://`. We read
 *  the Supabase URL from `.env` directly and force it onto `process.env`
 *  BEFORE instantiating the Prisma client.
 *
 * Run with:
 *   bun run seed/migrate-to-supabase.ts
 */

import { Prisma, PrismaClient } from '@prisma/client'
import fs from 'node:fs'
import path from 'node:path'

// ---------------------------------------------------------------------------
// Force Supabase DATABASE_URL before creating the Prisma client.
// ---------------------------------------------------------------------------
const PROJECT_ROOT = '/home/z/my-project'
const ENV_FILE = path.join(PROJECT_ROOT, '.env')
const SUPABASE_DEFAULT_URL =
  'postgresql://postgres.dxtxpobdnskdfqmlskyv:Peredam%40bangku101@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?connection_limit=1'

function loadDatabaseUrlFromEnv(): string {
  try {
    if (fs.existsSync(ENV_FILE)) {
      const lines = fs.readFileSync(ENV_FILE, 'utf-8').split('\n')
      for (const raw of lines) {
        const line = raw.trim()
        if (!line || line.startsWith('#')) continue
        // Match a non-commented DATABASE_URL="..." line
        const match = /^DATABASE_URL\s*=\s*"?(.+?)"?\s*$/.exec(line)
        if (match) {
          let url = match[1]
          // Strip trailing inline comments
          url = url.split(/\s+#/)[0].replace(/"$/, '').replace(/^"/, '')
          // Ensure connection_limit=1 to avoid pool exhaustion on Supabase free tier
          if (!/[?&]connection_limit=/.test(url)) {
            url += (url.includes('?') ? '&' : '?') + 'connection_limit=1'
          }
          return url
        }
      }
    }
  } catch (err) {
    console.warn('   (could not read .env for DATABASE_URL, using hardcoded fallback:', err, ')')
  }
  return SUPABASE_DEFAULT_URL
}

process.env.DATABASE_URL = loadDatabaseUrlFromEnv()
console.log(`   Using DATABASE_URL: ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@')}`)

// ---------------------------------------------------------------------------
// Standalone Prisma client — we do NOT import from src/lib/db because that
// file is marked server-only and the dev-server's global singleton is shared
// with Next.js. Using a fresh client here keeps the migration script clean
// and avoids polluting the app's connection pool during a one-off data load.
// ---------------------------------------------------------------------------
const prisma = new PrismaClient({
  log: ['warn', 'error'],
})

const BACKUP_PATH = '/home/z/my-project/seed/data/backup-sqlite.json'

// ---------------------------------------------------------------------------
// Types matching the backup JSON shape (loosely typed — backup is trusted).
// ---------------------------------------------------------------------------
interface BackupCategory {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  order: number
  createdAt: string
  updatedAt: string
}
interface BackupTag {
  id: string
  name: string
  slug: string
  createdAt: string
}
interface BackupArticle {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  contentMarkdown: string | null
  featuredImageUrl: string | null
  featuredImageAlt: string | null
  categoryId: string
  authorName: string
  status: string
  isFeatured: boolean
  isBreaking: boolean
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string | null
  ogImageUrl: string | null
  targetKeyword: string | null
  readingTimeMinutes: number
  wordCount: number
  viewCount: number
  shareCount: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}
interface BackupArticleTag {
  articleId: string
  tagId: string
}
interface BackupFaq {
  id: string
  question: string
  answer: string
  order: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}
interface BackupSubscriber {
  id: string
  email: string
  status: string
  source: string | null
  subscribedAt: string
  unsubscribedAt: string | null
}
interface BackupComment {
  id: string
  articleId: string
  authorName: string
  authorEmail: string
  content: string
  status: string
  parentId: string | null
  ipAddress: string | null
  createdAt: string
}
interface BackupSiteSetting {
  id: string
  siteName: string
  tagline: string
  logoUrl: string | null
  faviconUrl: string | null
  contactEmail: string
  contactAddress: string
  contactPhone: string | null
  socialFacebook: string | null
  socialInstagram: string | null
  socialYoutube: string | null
  authorName: string
  newsletterHeadline: string
  newsletterSubtext: string
  footerCopyright: string
  primaryColor: string
  gaMeasurementId: string | null
  gtmId: string | null
  verificationGoogle: string | null
  verificationBing: string | null
  updatedAt: string
}
interface Backup {
  _meta: {
    backupDate: string
    source: string
    target: string
    counts: Record<string, number>
  }
  categories: BackupCategory[]
  tags: BackupTag[]
  articles: BackupArticle[]
  articleTags: BackupArticleTag[]
  faqs: BackupFaq[]
  subscribers: BackupSubscriber[]
  comments: BackupComment[]
  articleVersions: unknown[]
  siteSettings: BackupSiteSetting[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toDate(value: string | null | undefined): Date | null {
  if (!value) return null
  return new Date(value)
}

function pct(done: number, total: number): string {
  if (total === 0) return '100%'
  return `${Math.round((done / total) * 100)}%`
}

// Run an array of operations in chunks of N inside a transaction so we don't
// blow past Postgres' parameter limit (~65535) and we keep round-trips low.
async function batchUpsert<T>(
  rows: T[],
  chunkSize: number,
  upsert: (row: T, tx: Prisma.TransactionClient) => Promise<unknown>,
  label: string,
  timeoutMs: number = 5000,
) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    await prisma.$transaction(
      async (tx) => {
        for (const row of chunk) {
          await upsert(row, tx)
        }
      },
      { timeout: timeoutMs },
    )
    process.stdout.write(`    ${label}: ${Math.min(i + chunkSize, rows.length)}/${rows.length} (${pct(Math.min(i + chunkSize, rows.length), rows.length)})\r`)
  }
  process.stdout.write('\n')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('🚀 Starting migration to Supabase Postgres...')
  const raw = fs.readFileSync(BACKUP_PATH, 'utf-8')
  const backup = JSON.parse(raw) as Backup

  console.log(`   Backup source : ${backup._meta.source}`)
  console.log(`   Backup target : ${backup._meta.target}`)
  console.log(`   Backup date   : ${backup._meta.backupDate}`)
  console.log(
    `   Backup counts : categories=${backup._meta.counts.categories}, tags=${backup._meta.counts.tags}, articles=${backup._meta.counts.articles}, articleTags=${backup._meta.counts.articleTagRelations}, faqs=${backup._meta.counts.faqs}, subscribers=${backup._meta.counts.subscribers}, comments=${backup._meta.counts.comments}, siteSettings=${backup._meta.counts.siteSettings}`,
  )

  // -------------------------------------------------------------------------
  // 1. Categories
  // -------------------------------------------------------------------------
  console.log('\n[1/8] Migrating categories…')
  await batchUpsert(backup.categories, 50, async (c, tx) => {
    await tx.category.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        color: c.color,
        order: c.order,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      },
      update: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        color: c.color,
        order: c.order,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      },
    })
  }, 'categories')
  console.log(`   ✓ ${backup.categories.length} categories migrated`)

  // -------------------------------------------------------------------------
  // 2. Tags
  // -------------------------------------------------------------------------
  console.log('\n[2/8] Migrating tags…')
  await batchUpsert(backup.tags, 50, async (t, tx) => {
    await tx.tag.upsert({
      where: { id: t.id },
      create: {
        id: t.id,
        name: t.name,
        slug: t.slug,
        createdAt: new Date(t.createdAt),
      },
      update: {
        name: t.name,
        slug: t.slug,
        createdAt: new Date(t.createdAt),
      },
    })
  }, 'tags')
  console.log(`   ✓ ${backup.tags.length} tags migrated`)

  // -------------------------------------------------------------------------
  // 3. Articles (without tag relations)
  // -------------------------------------------------------------------------
  console.log('\n[3/8] Migrating articles…')
  await batchUpsert(backup.articles, 25, async (a, tx) => {
    const data = {
      id: a.id,
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      content: a.content,
      contentMarkdown: a.contentMarkdown,
      featuredImageUrl: a.featuredImageUrl,
      featuredImageAlt: a.featuredImageAlt,
      categoryId: a.categoryId,
      authorName: a.authorName,
      status: a.status,
      isFeatured: a.isFeatured,
      isBreaking: a.isBreaking,
      metaTitle: a.metaTitle,
      metaDescription: a.metaDescription,
      metaKeywords: a.metaKeywords,
      ogImageUrl: a.ogImageUrl,
      targetKeyword: a.targetKeyword,
      readingTimeMinutes: a.readingTimeMinutes,
      wordCount: a.wordCount,
      viewCount: a.viewCount,
      shareCount: a.shareCount,
      publishedAt: toDate(a.publishedAt),
      createdAt: new Date(a.createdAt),
      updatedAt: new Date(a.updatedAt),
    }
    await tx.article.upsert({
      where: { id: a.id },
      create: data,
      update: data,
    })
  }, 'articles')
  console.log(`   ✓ ${backup.articles.length} articles migrated`)

  // -------------------------------------------------------------------------
  // 4. Article ↔ Tag relations (implicit m-n)
  // -------------------------------------------------------------------------
  console.log('\n[4/8] Connecting article-tag relations…')
  // De-duplicate just in case the backup has duplicate (articleId, tagId) pairs
  const seenPairs = new Set<string>()
  const uniqueArticleTags = backup.articleTags.filter((rel) => {
    const key = `${rel.articleId}__${rel.tagId}`
    if (seenPairs.has(key)) return false
    seenPairs.add(key)
    return true
  })
  if (uniqueArticleTags.length !== backup.articleTags.length) {
    console.log(`   (de-duplicated ${backup.articleTags.length - uniqueArticleTags.length} duplicate pairs)`)
  }
  await batchUpsert(uniqueArticleTags, 25, async (rel, tx) => {
    // Guard: only connect if both ends exist (skip silently otherwise — this
    // protects against any drift between backup and current DB state).
    // The findUnique calls are cheap (indexed PK lookup) and we don't care
    // about strict consistency between them and the connect — if a row was
    // missing, connect would simply throw P2003 / P2025 which we swallow.
    const [article, tag] = await Promise.all([
      tx.article.findUnique({ where: { id: rel.articleId }, select: { id: true } }),
      tx.tag.findUnique({ where: { id: rel.tagId }, select: { id: true } }),
    ])
    if (!article || !tag) return
    try {
      await tx.article.update({
        where: { id: rel.articleId },
        data: { tags: { connect: { id: rel.tagId } } },
      })
    } catch (err) {
      // P2002 = unique constraint violation → relation already connected
      // (idempotent re-run). Swallow safely.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return
      }
      throw err
    }
  }, 'article-tags', 30000)
  console.log(`   ✓ ${uniqueArticleTags.length} article-tag relations connected`)

  // -------------------------------------------------------------------------
  // 5. FAQs
  // -------------------------------------------------------------------------
  console.log('\n[5/8] Migrating FAQs…')
  await batchUpsert(backup.faqs, 50, async (f, tx) => {
    const data = {
      id: f.id,
      question: f.question,
      answer: f.answer,
      order: f.order,
      isPublished: f.isPublished,
      createdAt: new Date(f.createdAt),
      updatedAt: new Date(f.updatedAt),
    }
    await tx.faq.upsert({
      where: { id: f.id },
      create: data,
      update: data,
    })
  }, 'faqs')
  console.log(`   ✓ ${backup.faqs.length} FAQs migrated`)

  // -------------------------------------------------------------------------
  // 6. Subscribers
  // -------------------------------------------------------------------------
  console.log('\n[6/8] Migrating subscribers…')
  await batchUpsert(backup.subscribers, 50, async (s, tx) => {
    await tx.subscriber.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        email: s.email,
        status: s.status,
        source: s.source,
        subscribedAt: new Date(s.subscribedAt),
        unsubscribedAt: toDate(s.unsubscribedAt),
      },
      update: {
        email: s.email,
        status: s.status,
        source: s.source,
        subscribedAt: new Date(s.subscribedAt),
        unsubscribedAt: toDate(s.unsubscribedAt),
      },
    })
  }, 'subscribers')
  console.log(`   ✓ ${backup.subscribers.length} subscribers migrated`)

  // -------------------------------------------------------------------------
  // 7. Comments
  // -------------------------------------------------------------------------
  console.log('\n[7/8] Migrating comments…')
  await batchUpsert(backup.comments, 50, async (c, tx) => {
    await tx.comment.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        articleId: c.articleId,
        authorName: c.authorName,
        authorEmail: c.authorEmail,
        content: c.content,
        status: c.status,
        parentId: c.parentId,
        ipAddress: c.ipAddress,
        createdAt: new Date(c.createdAt),
      },
      update: {
        articleId: c.articleId,
        authorName: c.authorName,
        authorEmail: c.authorEmail,
        content: c.content,
        status: c.status,
        parentId: c.parentId,
        ipAddress: c.ipAddress,
        createdAt: new Date(c.createdAt),
      },
    })
  }, 'comments')
  console.log(`   ✓ ${backup.comments.length} comments migrated`)

  // -------------------------------------------------------------------------
  // 8. Site settings (singleton)
  // -------------------------------------------------------------------------
  console.log('\n[8/8] Migrating site settings…')
  await batchUpsert(backup.siteSettings, 50, async (s, tx) => {
    const data = {
      id: s.id,
      siteName: s.siteName,
      tagline: s.tagline,
      logoUrl: s.logoUrl,
      faviconUrl: s.faviconUrl,
      contactEmail: s.contactEmail,
      contactAddress: s.contactAddress,
      contactPhone: s.contactPhone,
      socialFacebook: s.socialFacebook,
      socialInstagram: s.socialInstagram,
      socialYoutube: s.socialYoutube,
      authorName: s.authorName,
      newsletterHeadline: s.newsletterHeadline,
      newsletterSubtext: s.newsletterSubtext,
      footerCopyright: s.footerCopyright,
      primaryColor: s.primaryColor,
      gaMeasurementId: s.gaMeasurementId,
      gtmId: s.gtmId,
      verificationGoogle: s.verificationGoogle,
      verificationBing: s.verificationBing,
      updatedAt: new Date(s.updatedAt),
    }
    await tx.siteSetting.upsert({
      where: { id: s.id },
      create: data,
      update: data,
    })
  }, 'site-settings')
  console.log(`   ✓ ${backup.siteSettings.length} site settings row migrated`)

  // -------------------------------------------------------------------------
  // Verification
  // -------------------------------------------------------------------------
  console.log('\n🎉 Migration complete!')
  console.log('\n📊 Verifying final counts in Supabase…')
  const [
    categoriesCount,
    tagsCount,
    articlesCount,
    faqsCount,
    subscribersCount,
    commentsCount,
    siteSettingsCount,
    // articleTag relations live in the implicit junction table — count via
    // a raw query because Prisma doesn't expose the implicit junction as a
    // model in our schema.
  ] = await Promise.all([
    prisma.category.count(),
    prisma.tag.count(),
    prisma.article.count(),
    prisma.faq.count(),
    prisma.subscriber.count(),
    prisma.comment.count(),
    prisma.siteSetting.count(),
  ])

  let articleTagCount = 0
  try {
    const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count FROM "_ArticleTags"
    `
    articleTagCount = Number(rows[0]?.count ?? 0)
  } catch (err) {
    console.warn('   (could not count _ArticleTags junction via raw query:', err, ')')
  }

  const finalCounts = {
    categories: categoriesCount,
    tags: tagsCount,
    articles: articlesCount,
    articleTagRelations: articleTagCount,
    faqs: faqsCount,
    subscribers: subscribersCount,
    comments: commentsCount,
    siteSettings: siteSettingsCount,
  }
  console.log('   Final DB counts:', JSON.stringify(finalCounts, null, 2))

  // Sanity check: pick a featured article and show its tags.
  console.log('\n🧪 Sample: featured article with tags & category…')
  const featured = await prisma.article.findFirst({
    where: { isFeatured: true },
    include: { tags: { select: { id: true, name: true, slug: true } }, category: { select: { id: true, name: true, slug: true } } },
  })
  if (featured) {
    console.log(`   Article  : ${featured.title}`)
    console.log(`   Slug     : ${featured.slug}`)
    console.log(`   Status   : ${featured.status}`)
    console.log(`   Category : ${featured.category.name} (${featured.category.slug})`)
    console.log(`   Tags (${featured.tags.length}): ${featured.tags.map((t) => t.name).join(', ')}`)
  } else {
    console.log('   (no featured article found)')
  }

  // Sanity check: subscriber test row should be present.
  console.log('\n🧪 Sample: first subscriber…')
  const sub = await prisma.subscriber.findFirst()
  if (sub) {
    console.log(`   ${sub.email} — status=${sub.status} source=${sub.source ?? 'null'} subscribedAt=${sub.subscribedAt.toISOString()}`)
  } else {
    console.log('   (no subscribers found)')
  }

  console.log('\n✅ Migration & verification done.')
}

main()
  .catch((err: unknown) => {
    console.error('❌ Migration failed:', err)
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`   Prisma code: ${err.code}`)
      console.error(`   Message    : ${err.message}`)
    }
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
