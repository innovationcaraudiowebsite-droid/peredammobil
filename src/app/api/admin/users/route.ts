import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdminApi } from '@/lib/auth'
import { db } from '@/lib/db'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const runtime = 'nodejs'

/**
 * GET /api/admin/users — list all profiles (admin only).
 */
export async function GET() {
  const session = await requireSuperAdminApi()
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
  try {
    const profiles = await db.profile.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { articles: true } },
      },
    })
    return NextResponse.json({ ok: true, profiles })
  } catch (err) {
    console.error('[api/admin/users] GET error:', err)
    return NextResponse.json({ ok: false, message: 'Gagal memuat daftar akun.' }, { status: 500 })
  }
}

/**
 * POST /api/admin/users — create a new user via Supabase Auth admin API +
 * insert Profile with role. Admin only.
 *
 * Body: { email, password, fullName?, role }
 */
export async function POST(req: NextRequest) {
  const session = await requireSuperAdminApi()
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  let body: { email?: unknown; password?: unknown; fullName?: unknown; role?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Body tidak valid.' }, { status: 400 })
  }

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : null
  const role = typeof body?.role === 'string' ? body.role : 'writer'

  if (!email || !email.includes('@')) {
    return NextResponse.json({ ok: false, message: 'Email tidak valid.' }, { status: 400 })
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ ok: false, message: 'Password minimal 8 karakter.' }, { status: 400 })
  }
  if (!['admin', 'editor', 'writer'].includes(role)) {
    return NextResponse.json({ ok: false, message: 'Role tidak valid.' }, { status: 400 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error || !data.user) {
      return NextResponse.json(
        { ok: false, message: error?.message || 'Gagal membuat user di Supabase Auth.' },
        { status: 400 },
      )
    }

    const userId = data.user.id

    // Trigger Supabase akan auto-create profile dengan role=writer.
    // Tapi kita update dengan role & fullName yang diminta.
    // Upsert: kalau trigger belum sempat create (race), kita create.
    const profile = await db.profile.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email,
        fullName,
        role,
        isActive: true,
      },
      update: {
        fullName,
        role,
        isActive: true,
      },
    })

    return NextResponse.json({
      ok: true,
      profile: {
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        role: profile.role,
        isActive: profile.isActive,
        lastLoginAt: profile.lastLoginAt?.toISOString() || null,
        createdAt: profile.createdAt.toISOString(),
        articleCount: 0,
      },
    })
  } catch (err) {
    console.error('[api/admin/users] POST error:', err)
    return NextResponse.json({ ok: false, message: 'Gagal membuat akun.' }, { status: 500 })
  }
}
