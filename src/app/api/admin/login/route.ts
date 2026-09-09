import { NextRequest, NextResponse } from 'next/server'
import { login, createSessionToken, setSessionCookie } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let body: { email?: unknown; password?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Body request tidak valid.' },
      { status: 400 },
    )
  }

  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, message: 'Email dan password wajib diisi.' },
      { status: 400 },
    )
  }

  const payload = await login(email, password)
  if (!payload) {
    return NextResponse.json(
      { ok: false, message: 'Email atau password salah, atau akun tidak aktif.' },
      { status: 401 },
    )
  }

  const token = createSessionToken(payload)
  const res = NextResponse.json({
    ok: true,
    user: { email: payload.email, role: payload.role },
  })
  setSessionCookie(res, token)
  return res
}
