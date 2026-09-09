/**
 * Supabase client helpers (server-only).
 *
 * Two clients are exported:
 *   - `supabaseAdmin`   — uses the secret service-role key (full access incl.
 *                        Storage writes & bucket admin). NEVER expose to the
 *                        client. Use for upload API routes and seed scripts.
 *   - `supabasePublic`  — uses the publishable anon key (public read access).
 *                        Safe to import in server components, but not client
 *                        components (still uses Node http). For browser use,
 *                        create the client inline in a 'use client' file.
 *
 * IMPORTANT — env loading:
 *   The sandbox exposes a *system* DATABASE_URL pointing to the legacy SQLite
 *   file. Bun prioritises system env over `.env` so we cannot rely on
 *   `process.env.SUPABASE_URL`. We re-parse `.env` manually to pick up the
 *   real Supabase values. This mirrors the approach used by the migration
 *   script (seed/migrate-to-supabase.ts).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import 'server-only'
import fs from 'node:fs'
import path from 'node:path'

const ENV_FILE = path.join(process.cwd(), '.env')

function loadEnvFile(): Record<string, string> {
  const vars: Record<string, string> = {}
  try {
    if (!fs.existsSync(ENV_FILE)) return vars
    const text = fs.readFileSync(ENV_FILE, 'utf-8')
    for (const raw of text.split('\n')) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const match = /^([A-Z_][A-Z0-9_]*)\s*=\s*"?(.+?)"?\s*$/.exec(line)
      if (match) {
        let value = match[2]
        // Strip trailing inline comments
        value = value.split(/\s+#/)[0]
        vars[match[1]] = value
      }
    }
  } catch (err) {
    console.warn('[supabase-server] failed to read .env:', err)
  }
  return vars
}

const env = loadEnvFile()

const SUPABASE_URL = env.SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_SECRET_KEY = env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY || ''
const NEXT_PUBLIC_SUPABASE_URL =
  env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  ''

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  throw new Error(
    '[supabase-server] Missing SUPABASE_URL or SUPABASE_SECRET_KEY. ' +
      'Check your .env file. (sandbox env override may shadow .env values).',
  )
}

/**
 * Admin client — service-role key. Full read/write on Storage, DB, Auth.
 * NEVER use this from a client component or expose the key.
 */
export const supabaseAdmin: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/**
 * Public client — anon/publishable key. Safe for read-only public bucket
 * access. Use in server components & route handlers when only public reads
 * are required (e.g. listing public assets).
 */
export const supabasePublic: SupabaseClient = createClient(
  NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

export { SUPABASE_URL }

/**
 * Build the public CDN URL for an object stored in a public Supabase bucket.
 *
 *   https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
 */
export function publicStorageUrl(bucket: string, objectPath: string): string {
  const base = (SUPABASE_URL || '').replace(/\/$/, '')
  return `${base}/storage/v1/object/public/${bucket}/${objectPath.replace(/^\//, '')}`
}

/** Bucket names used across the app — keep in sync with seed/setup-storage.ts */
export const BUCKETS = {
  ARTICLES_FEATURED: 'articles-featured',
  ARTICLES_INLINE: 'articles-inline',
  SITE_ASSETS: 'site-assets',
} as const
