/**
 * Setup admin pertama di Supabase Auth + Profile.
 *
 * Idempotent: kalau user sudah ada di Supabase Auth, skip create & update
 * profile role ke 'admin' kalau belum. Aman di-run berkali-kali.
 *
 * Usage: bun run seed/setup-admin.ts
 */
import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
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
        let value = match[2].split(/\s+#/)[0]
        vars[match[1]] = value
      }
    }
  } catch (err) {
    console.warn('failed to read .env:', err)
  }
  return vars
}

const env = loadEnvFile()
process.env.DATABASE_URL = env.DATABASE_URL || process.env.DATABASE_URL

const SUPABASE_URL = env.SUPABASE_URL
const SUPABASE_SECRET_KEY = env.SUPABASE_SECRET_KEY
const ADMIN_EMAIL = 'admin@peredammobiljakarta.com'
// Ambil password dari env ADMIN_PASSWORD (jangan hard-code)
const ADMIN_PASSWORD = env.ADMIN_PASSWORD

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env')
  process.exit(1)
}
if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
  console.error('❌ Missing ADMIN_PASSWORD in .env (min 8 chars)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const db = new PrismaClient()

async function main() {
  console.log('🚀 Setting up admin user:', ADMIN_EMAIL)

  // Step 1: Cek apakah user sudah ada di Supabase Auth
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error('❌ Failed to list users:', listError.message)
    process.exit(1)
  }

  const existing = existingUsers.users.find((u) => u.email === ADMIN_EMAIL)

  let userId: string

  if (existing) {
    console.log('  → User already exists in Supabase Auth, skipping create')
    userId = existing.id

    // Update password (kalau berubah dari sebelumnya)
    const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
    })
    if (updateErr) {
      console.warn('  ⚠ Failed to update password:', updateErr.message)
    } else {
      console.log('  ✓ Password updated')
    }
  } else {
    console.log('  → Creating new user in Supabase Auth...')
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    })
    if (error || !data.user) {
      console.error('❌ Failed to create user:', error?.message)
      process.exit(1)
    }
    userId = data.user.id
    console.log('  ✓ User created, id:', userId)
  }

  // Step 2: Cek & create/update Profile di Postgres
  const profile = await db.profile.findUnique({ where: { id: userId } })
  if (!profile) {
    console.log('  → Creating Profile row with role=admin...')
    await db.profile.create({
      data: {
        id: userId,
        email: ADMIN_EMAIL,
        fullName: 'Administrator',
        role: 'admin',
        isActive: true,
      },
    })
    console.log('  ✓ Profile created')
  } else {
    console.log('  → Updating existing Profile to role=admin & isActive=true...')
    await db.profile.update({
      where: { id: userId },
      data: {
        role: 'admin',
        isActive: true,
      },
    })
    console.log('  ✓ Profile updated')
  }

  console.log('')
  console.log('🎉 Admin setup complete!')
  console.log('   Email:', ADMIN_EMAIL)
  console.log('   Password: (from .env ADMIN_PASSWORD)')
  console.log('   Role: admin')
  console.log('   User ID:', userId)
  console.log('')
  console.log('Login di: /admin/login')

  await db.$disconnect()
}

main().catch((e) => {
  console.error('❌ Fatal:', e)
  process.exit(1)
})
