import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdminApi } from '@/lib/auth'
import { db } from '@/lib/db'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const runtime = 'nodejs'

/**
 * PUT /api/admin/users/[id] — update Profile (role, fullName, isActive).
 * Admin only. Note: tidak bisa ubah email (hard-coded di Supabase Auth).
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperAdminApi()
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
  const { id: userId } = await params

  let body: { fullName?: unknown; role?: unknown; isActive?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Body tidak valid.' }, { status: 400 })
  }

  const data: { fullName?: string | null; role?: string; isActive?: boolean } = {}
  if (typeof body.fullName === 'string') data.fullName = body.fullName.trim() || null
  if (typeof body.role === 'string' && ['admin', 'editor', 'writer'].includes(body.role)) {
    data.role = body.role
  }
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive

  try {
    const updated = await db.profile.update({
      where: { id: userId },
      data,
    })
    return NextResponse.json({ ok: true, profile: updated })
  } catch (err) {
    console.error('[api/admin/users] PUT error:', err)
    return NextResponse.json({ ok: false, message: 'Gagal update profile.' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/users/[id] — delete user via Supabase Auth admin API.
 * Profile akan auto-delete via cascade (kalau ada FK ON DELETE CASCADE),
 * atau kita delete manual di sini.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperAdminApi()
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
  const { id: userId } = await params

  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) {
      // User mungkin sudah di-delete dari auth tapi profile masih ada
      console.warn('[api/admin/users] auth.deleteUser warning:', error.message)
    }

    // Delete profile di DB juga (kalau belum ter-cascade)
    try {
      await db.profile.delete({ where: { id: userId } })
    } catch {
      // ignore kalau profile sudah tidak ada
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/admin/users] DELETE error:', err)
    return NextResponse.json({ ok: false, message: 'Gagal hapus akun.' }, { status: 500 })
  }
}
