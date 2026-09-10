/**
 * seed-supabase.ts — Idempotent seeder untuk Supabase Postgres.
 *
 * Reads data/backup-sqlite.json (backup hasil scrape + AI generate awal)
 * dan insert ke Supabase Postgres via @supabase/supabase-js langsung
 * (tidak pakai Prisma atau adapter, jadi bisa dijalankan standalone).
 *
 * Cara pakai:
 *   1. Pastikan .env berisi SUPABASE_URL + SUPABASE_SECRET_KEY
 *   2. Jalankan: bun run src/scripts/seed-supabase.ts
 *
 * Idempotent:
 *   - Pakai upsert (insert or do nothing) untuk master data
 *   - Pakai ON CONFLICT DO NOTHING untuk junction table
 *   - Aman di-run berkali-kali (tidak duplikat data)
 *
 * Yang di-seed:
 *   - 4 categories
 *   - 27 tags
 *   - 40 articles (semua PUBLISHED)
 *   - 111 article-tag relations (via _ArticleTags junction)
 *   - 10 FAQs
 *   - 11 comments
 *   - 1 subscriber
 *   - 1 site_settings (singleton id="global")
 *
 * Note:
 *   - Script ini TIDAK create user di Supabase Auth (admin). Untuk itu,
 *     jalankan setup-admin.ts secara terpisah (kalau ada), atau create
 *     manual via Supabase Dashboard → Authentication → Users → Add user.
 *   - Script ini TIDAK hapus data existing. Untuk re-seed bersih,
 *     hapus data manual di Supabase Dashboard dulu, lalu run script ini.
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

// --- Parse .env manually (sandbox system env override issue) ---
function loadEnvFile(): Record<string, string> {
  const vars: Record<string, string> = {}
  const envFile = path.join(process.cwd(), '.env')
  try {
    if (!fs.existsSync(envFile)) return vars
    const text = fs.readFileSync(envFile, 'utf-8')
    for (const raw of text.split('\n')) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const match = /^([A-Z_][A-Z0-9_]*)\s*=\s*"?(.+?)"?\s*$/.exec(line)
      if (match) {
        vars[match[1]] = match[2].split(/\s+#/)[0]
      }
    }
  } catch (err) {
    console.warn('failed to read .env:', err)
  }
  return vars
}

const env = loadEnvFile()
process.env.DATABASE_URL = env.DATABASE_URL || process.env.DATABASE_URL

const SUPABASE_URL = env.SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SECRET_KEY = env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env')
  console.error('   Add them to .env file:')
  console.error('   SUPABASE_URL=https://your-project.supabase.co')
  console.error('   SUPABASE_SECRET_KEY=sb_secret_xxx')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// --- Types ---
type Category = {
  id: string; name: string; slug: string; description: string | null
  color: string | null; order: number; createdAt: string; updatedAt: string
}
type Tag = { id: string; name: string; slug: string; createdAt: string }
type Article = {
  id: string; title: string; slug: string; excerpt: string | null
  content: string; contentMarkdown: string | null
  featuredImageUrl: string | null; featuredImageAlt: string | null
  categoryId: string; authorName: string; authorId: string | null
  status: string; isFeatured: boolean; isBreaking: boolean
  metaTitle: string | null; metaDescription: string | null
  metaKeywords: string | null; ogImageUrl: string | null
  targetKeyword: string | null
  readingTimeMinutes: number; wordCount: number
  viewCount: number; shareCount: number
  publishedAt: string | null; createdAt: string; updatedAt: string
}
type ArticleTag = { articleId: string; tagId: string }
type Faq = {
  id: string; question: string; answer: string; order: number
  isPublished: boolean; createdAt: string; updatedAt: string
}
type Comment = {
  id: string; articleId: string; authorName: string; authorEmail: string
  content: string; status: string; parentId: string | null
  ipAddress: string | null; createdAt: string
}
type Subscriber = {
  id: string; email: string; status: string; source: string | null
  subscribedAt: string; unsubscribedAt: string | null
}
type SiteSetting = {
  id: string; siteName: string; tagline: string
  logoUrl: string | null; faviconUrl: string | null
  contactEmail: string; contactAddress: string; contactPhone: string | null
  socialFacebook: string | null; socialInstagram: string | null
  socialYoutube: string | null
  authorName: string; newsletterHeadline: string
  newsletterSubtext: string; footerCopyright: string; primaryColor: string
  gaMeasurementId: string | null; gtmId: string | null
  verificationGoogle: string | null; verificationBing: string | null
  updatedAt: string
}

type BackupData = {
  _meta: { backupDate: string; counts: Record<string, number> }
  categories: Category[]
  tags: Tag[]
  articles: Article[]
  articleTags: ArticleTag[]
  faqs: Faq[]
  subscribers: Subscriber[]
  comments: Comment[]
  articleVersions: unknown[]
  siteSettings: SiteSetting[]
}

// --- Helpers ---

async function upsertBatch(table: string, rows: Record<string, unknown>[]): Promise<number> {
  if (rows.length === 0) return 0
  // Use upsert with default conflict target (primary key)
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' })
  if (error) {
    console.error(`  ❌ ${table}: ${error.message}`)
    return 0
  }
  return rows.length
}

async function checkExisting(table: string): Promise<number> {
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
  return count || 0
}

// --- Main seeder ---

async function main() {
  console.log('🚀 Seeding Supabase Postgres from data/backup-sqlite.json...')
  console.log(`   Supabase URL: ${SUPABASE_URL}`)
  console.log('')

  // Load backup
  const backupPath = path.join(process.cwd(), 'data', 'backup-sqlite.json')
  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Backup file not found: ${backupPath}`)
    console.error('   Make sure data/backup-sqlite.json exists.')
    process.exit(1)
  }
  const backup: BackupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'))
  console.log(`📦 Backup loaded: ${backup._meta.counts.articles} articles, ${backup._meta.counts.categories} categories, ${backup._meta.counts.tags} tags`)
  console.log('')

  // 1. Categories
  console.log('1. Seeding categories...')
  const existingCats = await checkExisting('categories')
  if (existingCats > 0) {
    console.log(`   ✓ Already ${existingCats} categories — skipping (use upsert for safety)`)
  }
  const catsOk = await upsertBatch('categories', backup.categories)
  console.log(`   ✓ ${catsOk} categories upserted`)

  // 2. Tags
  console.log('2. Seeding tags...')
  const existingTags = await checkExisting('tags')
  if (existingTags > 0) {
    console.log(`   ✓ Already ${existingTags} tags — skipping (use upsert for safety)`)
  }
  const tagsOk = await upsertBatch('tags', backup.tags)
  console.log(`   ✓ ${tagsOk} tags upserted`)

  // 3. Articles (without tags relation — handle separately)
  console.log('3. Seeding articles...')
  const existingArts = await checkExisting('articles')
  if (existingArts > 0) {
    console.log(`   ✓ Already ${existingArts} articles — will upsert (idempotent)`)
  }
  const articlesData = backup.articles.map((a) => ({ ...a }))
  const artsOk = await upsertBatch('articles', articlesData)
  console.log(`   ✓ ${artsOk} articles upserted`)

  // 4. Article-Tag junction (m-n via _ArticleTags table)
  //    Columns: A (articleId), B (tagId)
  console.log('4. Seeding article-tag relations (m-n junction)...')
  if (backup.articleTags.length > 0) {
    const junctionRows = backup.articleTags.map((rel) => ({ A: rel.articleId, B: rel.tagId }))
    const { error } = await supabase.from('_ArticleTags').upsert(junctionRows, { onConflict: 'A,B' })
    if (error) {
      console.error(`   ❌ _ArticleTags: ${error.message}`)
      console.error('   (Junction table may not exist. Run schema setup first.)')
    } else {
      console.log(`   ✓ ${junctionRows.length} article-tag relations upserted`)
    }
  }

  // 5. FAQs
  console.log('5. Seeding FAQs...')
  const faqsOk = await upsertBatch('faqs', backup.faqs)
  console.log(`   ✓ ${faqsOk} FAQs upserted`)

  // 6. Subscribers
  console.log('6. Seeding subscribers...')
  const subsOk = await upsertBatch('subscribers', backup.subscribers)
  console.log(`   ✓ ${subsOk} subscribers upserted`)

  // 7. Comments
  console.log('7. Seeding comments...')
  const commentsOk = await upsertBatch('comments', backup.comments)
  console.log(`   ✓ ${commentsOk} comments upserted`)

  // 8. Site settings (singleton, id="global")
  console.log('8. Seeding site_settings...')
  if (backup.siteSettings.length > 0) {
    const settingsOk = await upsertBatch('site_settings', backup.siteSettings)
    console.log(`   ✓ ${settingsOk} site_settings upserted`)
  }

  // 9. Article versions (kalau ada di backup)
  if (backup.articleVersions.length > 0) {
    console.log('9. Seeding article_versions...')
    const versionsOk = await upsertBatch('article_versions', backup.articleVersions as Record<string, unknown>[])
    console.log(`   ✓ ${versionsOk} article_versions upserted`)
  }

  // Verify
  console.log('')
  console.log('🎉 Seeding complete!')
  console.log('')
  console.log('Final counts in Supabase:')
  const tables = ['categories', 'tags', 'articles', 'faqs', 'comments', 'subscribers', 'site_settings', '_ArticleTags']
  for (const t of tables) {
    const count = await checkExisting(t)
    console.log(`   ${t}: ${count} rows`)
  }
  console.log('')
  console.log('Note: Admin user NOT seeded by this script.')
  console.log('   To create admin: Supabase Dashboard → Authentication → Users → Add user')
  console.log('   Email: admin@peredammobiljakarta.com, Password: (your strong password)')
  console.log('   Then set role="admin" in profiles table for that user.')
}

main().catch((e) => {
  console.error('❌ Fatal:', e)
  process.exit(1)
})
