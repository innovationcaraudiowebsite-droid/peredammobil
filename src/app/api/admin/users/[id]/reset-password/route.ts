import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const runtime = 'nodejs'

/**
 * POST /api/admin/users/[email]/reset-password
 * Admin-only: reset password user via Supabase Auth admin API.
 *
 * Body: { password: "new-password" }
 *
 * Note: pakai email sebagai identifier (bukan userId) karena lebih intuitif
 * untuk admin. Endpoint akan lookup userId via listUsers.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin()
  const email = decodeURIComponent((await params).id)

  let body: { password?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Body tidak valid.' }, { status: 400 })
  }

  const password = typeof body?.password === 'string' ? body.password : ''
  if (!password || password.length < 8) {
    return NextResponse.json({ ok: false, message: 'Password minimal 8 karakter.' }, { status: 400 })
  }

  try {
    const supabase = getSupabaseAdmin()
    // Cari user by email
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
      return NextResponse.json({ ok: false, message: listError.message }, { status: 500 })
    }
    const user = listData.users.find((u) => u.email === email)
    if (!user) {
      return NextResponse.json({ ok: false, message: `User dengan email ${email} tidak ditemukan.` }, { status: 404 })
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password,
    })
    if (updateError) {
      return NextResponse.json({ ok: false, message: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/admin/users/reset-password] error:', err)
    return NextResponse.json({ ok: false, message: 'Gagal reset password.' }, { status: 500 })
  }
}
