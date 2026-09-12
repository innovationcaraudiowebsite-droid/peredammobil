import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { db } from '@/lib/db'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const runtime = 'nodejs'

/**
 * GET /api/admin/profile — return profile dari session.userId.
 */
export async function GET() {
  const session = await requireAdminApi()
  try {
    const profile = await db.profile.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
      },
    })
    if (!profile) {
      return NextResponse.json({ ok: false, message: 'Profile tidak ditemukan.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, profile })
  } catch (err) {
    console.error('[api/admin/profile] GET error:', err)
    return NextResponse.json({ ok: false, message: 'Gagal memuat profil.' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/profile — update fullName dan/atau password akun sendiri.
 *
 * Body: { fullName?: string, password?: string }
 */
export async function PUT(req: NextRequest) {
  const session = await requireAdminApi()

  let body: { fullName?: unknown; password?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Body tidak valid.' }, { status: 400 })
  }

  const updates: { fullName?: string | null } = {}
  if (typeof body.fullName === 'string') {
    updates.fullName = body.fullName.trim() || null
  }

  const newPassword = typeof body.password === 'string' ? body.password : ''

  try {
    // Update Profile (fullName)
    if (updates.fullName !== undefined) {
      await db.profile.update({
        where: { id: session.userId },
        data: { fullName: updates.fullName },
      })
    }

    // Update password via Supabase Auth admin API
    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json({ ok: false, message: 'Password minimal 8 karakter.' }, { status: 400 })
      }
      const supabase = getSupabaseAdmin()
      const { error } = await supabase.auth.admin.updateUserById(session.userId, {
        password: newPassword,
      })
      if (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/admin/profile] PUT error:', err)
    return NextResponse.json({ ok: false, message: 'Gagal update profil.' }, { status: 500 })
  }
}
