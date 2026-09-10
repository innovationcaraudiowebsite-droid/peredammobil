/**
 * update-images.ts — Update featuredImageUrl semua artikel ke URL Supabase Storage.
 *
 * Skrip ini menangani masalah dimana beberapa artikel masih punya URL gambar
 * lama (peredammobiljakarta.com/uploads/...) atau NULL, padahal gambar sudah
 * di-upload ke Supabase Storage bucket 'articles-featured'.
 *
 * Skrip ini:
 *   1. Fetch semua artikel dari DB
 *   2. List semua file di bucket 'articles-featured'
 *   3. Untuk setiap artikel: cari file `{slug}.webp` di bucket
 *   4. Update featuredImageUrl di DB ke URL Supabase Storage
 *
 * Idempotent: aman di-run berkali-kali (skip kalau URL sudah benar).
 *
 * Cara pakai:
 *   bun run src/scripts/update-images.ts
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

// --- Parse .env manually ---
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
const SUPABASE_URL = env.SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SECRET_KEY = env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env')
  process.exit(1)
}

const BUCKET = 'articles-featured'

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function main() {
  console.log('🔧 Update featuredImageUrl semua artikel ke URL Supabase Storage...')
  console.log(`   Supabase URL: ${SUPABASE_URL}`)
  console.log(`   Bucket: ${BUCKET}`)
  console.log('')

  // 1. Fetch semua artikel
  const { data: articles, error: aErr } = await supabase
    .from('articles')
    .select('id, slug, title, featuredImageUrl')
  if (aErr) {
    console.error('❌ Gagal fetch articles:', aErr.message)
    process.exit(1)
  }
  console.log(`📦 Total artikel di DB: ${articles?.length || 0}`)

  // 2. List semua file di bucket
  const { data: files, error: fErr } = await supabase.storage.from(BUCKET).list('', { limit: 200 })
  if (fErr) {
    console.error('❌ Gagal list files:', fErr.message)
    process.exit(1)
  }
  const fileNames = new Set((files || []).map((f) => f.name))
  console.log(`🖼  Total files di bucket '${BUCKET}': ${fileNames.size}`)
  console.log('')

  let updated = 0
  let skipped = 0
  let missingImage = 0

  for (const article of articles || []) {
    const expectedFile = `${article.slug}.webp`
    if (!fileNames.has(expectedFile)) {
      console.log(`  ⚠ Missing image for: ${article.slug}`)
      missingImage++
      continue
    }
    const newUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${expectedFile}`

    // Update kalau URL berubah
    if (article.featuredImageUrl !== newUrl) {
      const { error: upErr } = await supabase
        .from('articles')
        .update({ featuredImageUrl: newUrl })
        .eq('id', article.id)
      if (upErr) {
        console.error(`  ❌ ${article.slug}: ${upErr.message}`)
      } else {
        updated++
      }
    } else {
      skipped++
    }
  }

  console.log('')
  console.log('🎉 Update complete!')
  console.log(`   ✅ Updated: ${updated}`)
  console.log(`   ⏭ Skipped (sudah benar): ${skipped}`)
  console.log(`   ⚠ Missing image (no file in bucket): ${missingImage}`)

  // Verify sample
  console.log('')
  console.log('=== Verify sample 5 ===')
  const { data: verify } = await supabase
    .from('articles')
    .select('slug, featuredImageUrl')
    .limit(5)
  verify?.forEach((a) =>
    console.log(`  ${a.slug}: ${a.featuredImageUrl?.substring(0, 80) || 'NULL'}`),
  )
}

main().catch((e) => {
  console.error('❌ Fatal:', e)
  process.exit(1)
})
