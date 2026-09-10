import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/health — diagnostic endpoint untuk debug Supabase connection.
 * Public (no auth), tapi TIDAK expose secret values.
 *
 * Returns:
 *   - env vars status (present or not, masked)
 *   - DB connection test (count articles & profiles)
 *   - Storage connection test (list buckets)
 */
export async function GET() {
  // Mask env var value: tampilkan hanya prefix + length
  const mask = (v: string | undefined): string => {
    if (!v) return 'MISSING'
    if (v.length < 10) return `PRESENT (${v.length} chars)`
    return `PRESENT (${v.length} chars, ${v.substring(0, 10)}...)`
  }

  const envStatus = {
    SUPABASE_URL: mask(process.env.SUPABASE_URL),
    SUPABASE_SECRET_KEY: mask(process.env.SUPABASE_SECRET_KEY),
    NEXT_PUBLIC_SUPABASE_URL: mask(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: mask(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    ADMIN_SESSION_SECRET: mask(process.env.ADMIN_SESSION_SECRET),
    ADMIN_PASSWORD: mask(process.env.ADMIN_PASSWORD),
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'MISSING',
    DATABASE_URL: mask(process.env.DATABASE_URL), // legacy Prisma, no longer needed
    NODE_ENV: process.env.NODE_ENV || 'MISSING',
  }

  // Test Supabase connection
  let dbTest: Record<string, unknown> = { ok: false }
  try {
    const supabase = getSupabaseAdmin()

    const [articles, profiles, categories, faqs] = await Promise.all([
      supabase.from('articles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('faqs').select('*', { count: 'exact', head: true }),
    ])

    dbTest = {
      ok: true,
      articles: articles.count || 0,
      profiles: profiles.count || 0,
      categories: categories.count || 0,
      faqs: faqs.count || 0,
      articlesError: articles.error?.message || null,
      profilesError: profiles.error?.message || null,
      categoriesError: categories.error?.message || null,
      faqsError: faqs.error?.message || null,
    }
  } catch (err) {
    dbTest = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }

  // Test Storage
  let storageTest: Record<string, unknown> = { ok: false }
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.storage.listBuckets()
    storageTest = {
      ok: !error,
      buckets: (data || []).map((b) => b.name),
      error: error?.message || null,
    }
  } catch (err) {
    storageTest = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    env: envStatus,
    database: dbTest,
    storage: storageTest,
    // Diagnosis: berikan hint kenapa homepage mungkin kosong
    diagnosis: {
      hasAllRequiredEnvVars:
        !!process.env.SUPABASE_URL &&
        !!process.env.SUPABASE_SECRET_KEY &&
        !!process.env.ADMIN_SESSION_SECRET,
      hasArticles: (dbTest as { articles?: number }).articles !== undefined && (dbTest as { articles?: number }).articles! > 0,
      message:
        (dbTest as { articles?: number }).articles && (dbTest as { articles?: number }).articles! > 0
          ? 'DB connection OK. Articles found. Homepage should display them.'
          : 'DB connection issue OR no articles in DB. Check env vars and run seed script.',
    },
  })
}
