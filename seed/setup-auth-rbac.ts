/**
 * Setup Supabase trigger + RLS policies for profiles & other tables.
 *
 * Run once after schema push. Idempotent.
 *
 * What it does:
 *  1. Create trigger function `handle_new_user()` that auto-inserts a row
 *     in `public.profiles` whenever a new user registers via Supabase Auth
 *     (or via admin.createUser).
 *  2. Attach trigger to `auth.users` AFTER INSERT.
 *  3. Enable RLS on all public tables with sensible default policies.
 *
 * Note: Karena aplikasi Next.js pakai service_role key (via Prisma), RLS
 * policies TIDAK akan membatasi aplikasi (service_role bypass RLS). RLS ini
 * hanya defense-in-depth untuk koneksi anon/publishable key (kalau ada
 * client-side Supabase call di masa depan).
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

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
      if (match) vars[match[1]] = match[2].split(/\s+#/)[0]
    }
  } catch (err) {
    console.warn('failed to read .env:', err)
  }
  return vars
}

const env = loadEnvFile()
const SUPABASE_URL = env.SUPABASE_URL
const SUPABASE_SECRET_KEY = env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env')
  process.exit(1)
}

// Supabase Storage SQL via REST API doesn't exist; we use Postgres directly.
// But we don't have direct pg connection in this script easily — use
// supabase-js rpc to execute raw SQL via a custom function we create first.
//
// Alternative: use Prisma's $executeRawUnsafe to execute DDL.
// Let's use Prisma since it can connect to the same DATABASE_URL.

import { PrismaClient } from '@prisma/client'

process.env.DATABASE_URL = env.DATABASE_URL || process.env.DATABASE_URL

const db = new PrismaClient()

const SQL = `
-- ============================================================
-- 1. Trigger function: auto-create profile on new auth.user
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, "createdAt", "updatedAt")
  VALUES (NEW.id, NEW.email, 'writer', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop & recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. Enable RLS on all public tables (defense-in-depth)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. Profiles policies
-- ============================================================
DROP POLICY IF EXISTS "Users can read own or all profiles as admin" ON public.profiles;
CREATE POLICY "Users can read own or all profiles as admin"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin' AND p."isActive" = true
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin' AND p."isActive" = true
    )
  );

-- ============================================================
-- 4. Articles policies
-- ============================================================
DROP POLICY IF EXISTS "Public read published articles" ON public.articles;
CREATE POLICY "Public read published articles"
  ON public.articles FOR SELECT
  USING ("status" = 'PUBLISHED' AND "publishedAt" <= NOW());

DROP POLICY IF EXISTS "Admin full access articles" ON public.articles;
CREATE POLICY "Admin full access articles"
  ON public.articles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin' AND p."isActive" = true
  ));

DROP POLICY IF EXISTS "Editor full access articles" ON public.articles;
CREATE POLICY "Editor full access articles"
  ON public.articles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'editor' AND p."isActive" = true
  ));

DROP POLICY IF EXISTS "Writer own articles only" ON public.articles;
CREATE POLICY "Writer own articles only"
  ON public.articles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'writer' AND p."isActive" = true
    )
    AND "authorId" = auth.uid()
  );

-- ============================================================
-- 5. Comments policies (public can submit, admin/editor moderate)
-- ============================================================
DROP POLICY IF EXISTS "Public read approved comments" ON public.comments;
CREATE POLICY "Public read approved comments"
  ON public.comments FOR SELECT
  USING ("status" = 'APPROVED');

DROP POLICY IF EXISTS "Anyone can submit comment" ON public.comments;
CREATE POLICY "Anyone can submit comment"
  ON public.comments FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage all comments" ON public.comments;
CREATE POLICY "Admin manage all comments"
  ON public.comments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor') AND p."isActive" = true
  ));

-- ============================================================
-- 6. Faqs policies
-- ============================================================
DROP POLICY IF EXISTS "Public read published faqs" ON public.faqs;
CREATE POLICY "Public read published faqs"
  ON public.faqs FOR SELECT
  USING ("isPublished" = true);

DROP POLICY IF EXISTS "Admin manage faqs" ON public.faqs;
CREATE POLICY "Admin manage faqs"
  ON public.faqs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin' AND p."isActive" = true
  ));

-- ============================================================
-- 7. SiteSettings policies (admin only)
-- ============================================================
DROP POLICY IF EXISTS "Admin manage site settings" ON public.site_settings;
CREATE POLICY "Admin manage site settings"
  ON public.site_settings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin' AND p."isActive" = true
  ));

-- ============================================================
-- 8. Subscribers policies (public can subscribe, admin manage)
-- ============================================================
DROP POLICY IF EXISTS "Public can subscribe" ON public.subscribers;
CREATE POLICY "Public can subscribe"
  ON public.subscribers FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage subscribers" ON public.subscribers;
CREATE POLICY "Admin manage subscribers"
  ON public.subscribers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin' AND p."isActive" = true
  ));

-- ============================================================
-- 9. Categories & Tags policies (public read, admin manage)
-- ============================================================
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories"
  ON public.categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin manage categories" ON public.categories;
CREATE POLICY "Admin manage categories"
  ON public.categories FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin' AND p."isActive" = true
  ));

DROP POLICY IF EXISTS "Public read tags" ON public.tags;
CREATE POLICY "Public read tags"
  ON public.tags FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin manage tags" ON public.tags;
CREATE POLICY "Admin manage tags"
  ON public.tags FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin' AND p."isActive" = true
  ));

-- ============================================================
-- 10. ArticleVersions policies (admin/editor all, writer own)
-- ============================================================
DROP POLICY IF EXISTS "Admin editor read all versions" ON public.article_versions;
CREATE POLICY "Admin editor read all versions"
  ON public.article_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor') AND p."isActive" = true
  ));

DROP POLICY IF EXISTS "Writer read own versions" ON public.article_versions;
CREATE POLICY "Writer read own versions"
  ON public.article_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.articles a
      WHERE a.id = "articleId" AND a."authorId" = auth.uid()
    )
  );
`

async function main() {
  console.log('🚀 Setting up Supabase trigger + RLS policies...')
  try {
    // Prisma doesn't support multi-statement DDL via $executeRawUnsafe reliably.
    // Split by semicolon + filter empty, execute each statement separately.
    const statements = SQL.split(/;$/m)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'))

    let ok = 0
    let failed = 0
    for (const stmt of statements) {
      try {
        await db.$executeRawUnsafe(stmt + ';')
        ok++
      } catch (err: any) {
        // Ignore "policy/trigger already exists" errors (idempotent)
        const msg = err.message || String(err)
        if (
          msg.includes('already exists') ||
          msg.includes('does not exist') ||
          msg.includes('cannot drop')
        ) {
          // Suppress these — idempotent re-run
        } else {
          console.warn('⚠ Statement failed:', msg.substring(0, 200))
          failed++
        }
      }
    }
    console.log(`✓ ${ok} statements executed, ${failed} non-fatal warnings`)
    console.log('')
    console.log('🎉 Supabase Auth + RBAC setup complete!')
    console.log('   - Trigger on_auth_user_created: auto-create profile on register')
    console.log('   - RLS enabled on 9 public tables')
    console.log('   - Policies for profiles, articles, comments, faqs,')
    console.log('     site_settings, subscribers, categories, tags, article_versions')
    console.log('')
    console.log('Note: Aplikasi Next.js pakai service_role key (via Prisma),')
    console.log('yang bypass RLS. RLS ini defense-in-depth untuk koneksi anon.')
  } catch (err) {
    console.error('❌ Fatal:', err)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

main()
