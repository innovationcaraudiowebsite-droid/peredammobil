/**
 * Task ID: M5 — Setup Supabase Storage buckets.
 *
 * Creates the three public buckets the portal needs:
 *   - articles-featured   (1200×675 featured images on article cards/detail)
 *   - articles-inline     (inline images embedded inside article bodies)
 *   - site-assets         (logo, favicon, OG images, misc site uploads)
 *
 * All three are public-read so next/image and the public portal can load
 * them without signed URLs. Writes remain admin-only (server-side service
 * role key).
 *
 * Idempotent: skips buckets that already exist (the API returns
 * `BucketAlreadyExists` which we swallow).
 *
 * Run with:
 *   bun run seed/setup-storage.ts
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

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

const env = loadEnvFile()
const SUPABASE_URL = env.SUPABASE_URL || ''
const SUPABASE_SECRET_KEY = env.SUPABASE_SECRET_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const BUCKETS = [
  { name: 'articles-featured', public: true },
  { name: 'articles-inline', public: true },
  { name: 'site-assets', public: true },
] as const

async function main() {
  console.log(`Setup Supabase Storage on ${SUPABASE_URL}`)
  for (const bucket of BUCKETS) {
    const { error } = await supabase.storage.createBucket(bucket.name, {
      public: bucket.public,
      // 50 MB per file is plenty for featured images / inline uploads.
      fileSizeLimit: 50 * 1024 * 1024,
      // Allow common image MIME types only.
      allowedMimeTypes: [
        'image/png',
        'image/jpeg',
        'image/webp',
        'image/avif',
        'image/gif',
        'image/svg+xml',
      ],
    })
    if (error) {
      // BucketAlreadyExists comes back as a generic error with this hint.
      const msg = (error.message || '').toLowerCase()
      if (msg.includes('already exists') || msg.includes('bucket already')) {
        console.log(`✓ Bucket "${bucket.name}" already exists — skipped`)
      } else {
        console.error(`✗ Failed to create "${bucket.name}":`, error.message)
      }
    } else {
      console.log(`✓ Created bucket "${bucket.name}" (public=${bucket.public})`)
    }
  }

  // List buckets to verify
  const { data, error: listErr } = await supabase.storage.listBuckets()
  if (listErr) {
    console.error('✗ Failed to list buckets:', listErr.message)
    process.exit(1)
  }
  const names = (data || []).map((b) => b.name).sort()
  console.log(`\nBuckets available now: ${names.join(', ')}`)

  // Verify each of our buckets is public
  for (const bucket of BUCKETS) {
    const found = (data || []).find((b) => b.name === bucket.name)
    if (!found) {
      console.error(`✗ Bucket "${bucket.name}" missing after create!`)
      continue
    }
    const isPublic = (found as { public?: boolean }).public ?? false
    console.log(
      `  ${isPublic ? '✓' : '⚠'}  ${bucket.name} — public=${isPublic} id=${found.id}`,
    )
  }
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
