/**
 * Backup SQLite database to JSON before migration to Supabase Postgres.
 * Output: /home/z/my-project/seed/data/backup-sqlite.json
 */
import { db } from '../src/lib/db'

async function main() {
  console.log('📦 Backing up SQLite database to JSON...')

  const all = await Promise.all([
    db.category.findMany(),
    db.tag.findMany(),
    db.article.findMany({ include: { tags: true, category: true } }),
    db.faq.findMany(),
    db.subscriber.findMany(),
    db.comment.findMany(),
    db.articleVersion.findMany(),
    db.siteSetting.findMany(),
  ])
  const [categories, tags, articles, faqs, subscribers, comments, versions, settings] = all

  // Extract tag relations from articles
  const articleTagRelations: { articleId: string; tagId: string }[] = []
  articles.forEach(a => {
    a.tags.forEach(t => articleTagRelations.push({ articleId: a.id, tagId: t.id }))
  })

  const backup = {
    _meta: {
      backupDate: new Date().toISOString(),
      source: 'SQLite (local file)',
      target: 'Supabase Postgres',
      counts: {
        categories: categories.length,
        tags: tags.length,
        articles: articles.length,
        articleTagRelations: articleTagRelations.length,
        faqs: faqs.length,
        subscribers: subscribers.length,
        comments: comments.length,
        articleVersions: versions.length,
        siteSettings: settings.length,
      },
    },
    categories: categories.map(c => ({ ...c })),
    tags: tags.map(t => ({ ...t })),
    articles: articles.map(a => {
      // Strip nested tags & category objects (keep only IDs)
      const { tags: _tags, category: _category, ...rest } = a as any
      return rest
    }),
    articleTags: articleTagRelations,
    faqs: faqs.map(f => ({ ...f })),
    subscribers: subscribers.map(s => ({ ...s })),
    comments: comments.map(c => ({ ...c })),
    articleVersions: versions.map(v => ({ ...v })),
    siteSettings: settings.map(s => ({ ...s })),
  }

  const fs = await import('fs')
  const outputPath = '/home/z/my-project/seed/data/backup-sqlite.json'
  fs.writeFileSync(outputPath, JSON.stringify(backup, null, 2))

  console.log('✅ Backup complete!')
  console.log(`   Output: ${outputPath}`)
  console.log(`   Size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`)
  console.log('   Counts:')
  Object.entries(backup._meta.counts).forEach(([k, v]) => {
    console.log(`     ${k}: ${v}`)
  })

  await db.$disconnect()
}

main().catch(e => {
  console.error('❌ Backup failed:', e)
  process.exit(1)
})
