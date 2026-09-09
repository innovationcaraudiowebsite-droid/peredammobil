/**
 * Supabase client helpers (server-only) — Vercel-build-safe.
 *
 * Two lazy clients are exposed via getter functions:
 *   - `getSupabaseAdmin()`   — service-role key (full access incl. Storage
 *                            writes & bucket admin). NEVER expose to client.
 *   - `getSupabasePublic()`  — publishable anon key (public read access).
 *
 * Why lazy (not module-level):
 *   Next.js "Collecting page data" build phase imports every route module
 *   to discover its exports. If we instantiate `createClient()` at module
 *   top-level and the env vars are missing, the build throws. On Vercel,
 *   env vars are only injected at runtime, so we defer client creation
 *   until the first request.
 *
 * IMPORTANT — env loading:
 *   The sandbox exposes a *system* DATABASE_URL pointing to the legacy
 *   SQLite file. Bun prioritises system env over `.env` so we cannot
 *   always rely on `process.env.SUPABASE_URL`. We re-parse `.env` manually
 *   as a fallback (only in development; in production Vercel env vars are
 *   authoritative and process.env is preferred).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import 'server-only'
import fs from 'node:fs'
import path from 'node:path'

const ENV_FILE = path.join(process.cwd(), '.env')

let cachedEnv: Record<string, string> | null = null

function loadEnvFile(): Record<string, string> {
  if (cachedEnv) return cachedEnv
  const vars: Record<string, string> = {}
  try {
    if (fs.existsSync(ENV_FILE)) {
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
    }
  } catch (err) {
    console.warn('[supabase-server] failed to read .env:', err)
  }
  cachedEnv = vars
  return vars
}

function pickEnv(key: string): string {
  // In production (Vercel), process.env is authoritative.
  // In dev sandbox, system env may shadow .env with stale values (SQLite),
  // so for SUPABASE_* keys we prefer .env file values when process.env is empty
  // OR when the value looks like the legacy SQLite URL.
  const fromProcess = process.env[key]
  if (fromProcess && !fromProcess.startsWith('file:')) {
    return fromProcess
  }
  const fromFile = loadEnvFile()[key]
  return fromFile || ''
}

let _admin: SupabaseClient | null = null
let _public: SupabaseClient | null = null

function requireVars(): { url: string; secretKey: string; publicUrl: string; publicKey: string } {
  const url = pickEnv('SUPABASE_URL')
  const secretKey = pickEnv('SUPABASE_SECRET_KEY')
  const publicUrl = pickEnv('NEXT_PUBLIC_SUPABASE_URL') || url
  const publicKey = pickEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  if (!url || !secretKey) {
    throw new Error(
      '[supabase-server] Missing SUPABASE_URL or SUPABASE_SECRET_KEY. ' +
        'Set them in Vercel Project Settings → Environment Variables, ' +
        'or in your local .env file. (If you are seeing this during build, ' +
        'make sure these env vars are NOT marked "Build" only — they must ' +
        'be available at runtime too.)',
    )
  }
  return { url, secretKey, publicUrl, publicKey }
}

/**
 * Admin client — service-role key. Full read/write on Storage, DB, Auth.
 * NEVER use from a client component or expose the key.
 *
 * Lazy: the client is created on first call. This avoids module-load errors
 * during Vercel build phase when env vars aren't yet injected.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_admin) return _admin
  const { url, secretKey } = requireVars()
  _admin = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return _admin
}

/**
 * Public client — anon/publishable key. Safe for read-only public bucket
 * access. Use in server components & route handlers when only public reads
 * are required.
 *
 * Lazy: see getSupabaseAdmin() for rationale.
 */
export function getSupabasePublic(): SupabaseClient {
  if (_public) return _public
  const { publicUrl, publicKey } = requireVars()
  // If public key is missing (e.g. only secret key configured), fall back
  // gracefully — many server-side flows only need the admin client.
  if (!publicKey) {
    return getSupabaseAdmin()
  }
  _public = createClient(publicUrl, publicKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return _public
}

/**
 * @deprecated Use getSupabaseAdmin() instead. Kept for backward compat
 * with code that imports `supabaseAdmin` as a property — those imports
 * will still work but the client is created lazily on first access.
 */
export const supabaseAdmin = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getSupabaseAdmin()
      const value = (client as unknown as Record<string | symbol, unknown>)[prop]
      return typeof value === 'function' ? value.bind(client) : value
    },
  },
) as SupabaseClient

/**
 * @deprecated Use getSupabasePublic() instead.
 */
export const supabasePublic = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getSupabasePublic()
      const value = (client as unknown as Record<string | symbol, unknown>)[prop]
      return typeof value === 'function' ? value.bind(client) : value
    },
  },
) as SupabaseClient

export function getSupabaseUrl(): string {
  return pickEnv('SUPABASE_URL') || pickEnv('NEXT_PUBLIC_SUPABASE_URL')
}

/**
 * Build the public CDN URL for an object stored in a public Supabase bucket.
 *
 *   https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
 */
export function publicStorageUrl(bucket: string, objectPath: string): string {
  const base = getSupabaseUrl().replace(/\/$/, '')
  return `${base}/storage/v1/object/public/${bucket}/${objectPath.replace(/^\//, '')}`
}

/** Bucket names used across the app — keep in sync with seed/setup-storage.ts */
export const BUCKETS = {
  ARTICLES_FEATURED: 'articles-featured',
  ARTICLES_INLINE: 'articles-inline',
  SITE_ASSETS: 'site-assets',
} as const
