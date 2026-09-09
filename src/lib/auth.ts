import 'server-only'
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { db } from '@/lib/db'

const COOKIE_NAME = 'admin_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret || secret.length < 16) {
    throw new Error('ADMIN_SESSION_SECRET is missing or too short (min 16 chars).')
  }
  return secret
}

function base64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf.toString('base64url')
}

function fromBase64url(input: string): Buffer {
  return Buffer.from(input, 'base64url')
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

export interface SessionPayload {
  userId: string // Profile.id (UUID dari auth.users.id)
  email: string
  role: string // admin | editor | writer
  exp: number
  nonce?: string
}

/**
 * Login via Supabase Auth (signInWithPassword).
 * Verifies credentials via Supabase, then fetches Profile untuk dapatkan role.
 * Returns SessionPayload kalau sukses, null kalau gagal (cred salah / user tidak aktif).
 */
export async function login(email: string, password: string): Promise<SessionPayload | null> {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error || !data.user) {
      console.error('[auth] signInWithPassword failed:', error?.message)
      return null
    }

    // Profile lookup (trigger auto-creates row on register, but be defensive)
    const profile = await db.profile.findUnique({
      where: { id: data.user.id },
    })
    if (!profile) {
      // Profile belum ada — create manual dengan role writer default
      // (seharusnya trigger Supabase yang create, tapi fallback untuk safety)
      try {
        await db.profile.create({
          data: {
            id: data.user.id,
            email: data.user.email || email.trim().toLowerCase(),
            role: 'writer',
          },
        })
      } catch (e) {
        console.error('[auth] profile not found & create failed:', e)
        return null
      }
      // Re-fetch
      const newProfile = await db.profile.findUnique({ where: { id: data.user.id } })
      if (!newProfile) return null
      return makePayload(newProfile.id, newProfile.email, newProfile.role)
    }
    if (!profile.isActive) {
      console.error('[auth] user is inactive:', profile.email)
      return null
    }

    // Update lastLoginAt (fire & forget)
    db.profile
      .update({
        where: { id: profile.id },
        data: { lastLoginAt: new Date() },
      })
      .catch((e) => console.error('[auth] update lastLoginAt failed:', e))

    return makePayload(profile.id, profile.email, profile.role)
  } catch (err) {
    console.error('[auth] login error:', err)
    return null
  }
}

function makePayload(userId: string, email: string, role: string): SessionPayload {
  return {
    userId,
    email,
    role,
    exp: Date.now() + SESSION_TTL_MS,
    nonce: randomBytes(8).toString('hex'),
  }
}

/**
 * Create signed session token: base64url(payload).base64url(hmacSignature)
 */
export function createSessionToken(payload: SessionPayload): string {
  const secret = getSecret()
  const payloadB64 = base64url(JSON.stringify(payload))
  const sig = createHmac('sha256', secret).update(payloadB64).digest()
  const sigB64 = base64url(sig)
  return `${payloadB64}.${sigB64}`
}

/**
 * Verify token signature & expiration. Returns decoded payload or null.
 */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') return null
  if (!token.includes('.')) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payloadB64, sigB64] = parts

  const secret = getSecret()
  const expectedSig = createHmac('sha256', secret).update(payloadB64).digest()
  const receivedSig = fromBase64url(sigB64)

  if (expectedSig.length !== receivedSig.length) return false as unknown as null
  if (!timingSafeEqual(expectedSig, receivedSig)) return null

  let payload: SessionPayload
  try {
    payload = JSON.parse(fromBase64url(payloadB64).toString('utf8'))
  } catch {
    return null
  }
  if (!payload || typeof payload.exp !== 'number') return null
  if (Date.now() > payload.exp) return null
  return payload
}

/**
 * Set httpOnly session cookie on a NextResponse (used in API routes).
 */
export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  })
}

/**
 * Clear session cookie on a NextResponse (used in API routes).
 */
export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}

export const SESSION_COOKIE_NAME = COOKIE_NAME

export interface Session {
  userId: string
  email: string
  role: string
}

/**
 * Read session from next/headers cookies. Returns session info or null.
 * Does NOT re-verify isActive di DB (untuk performance). Callers yang butuh
 * cek strict bisa pakai requireAdmin/requireEditor/requireSuperAdmin.
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const payload = await verifySessionToken(token)
  if (!payload) return null
  return { userId: payload.userId, email: payload.email, role: payload.role }
}

async function verifyProfileActive(userId: string): Promise<boolean> {
  try {
    const profile = await db.profile.findUnique({
      where: { id: userId },
      select: { isActive: true },
    })
    return !!profile?.isActive
  } catch (err) {
    console.error('[auth] verifyProfileActive error:', err)
    return false
  }
}

/**
 * Require any authenticated admin (admin/editor/writer).
 * Use for halaman admin umum.
 */
export async function requireAdmin(): Promise<Session> {
  const session = await getSession()
  if (
    !session ||
    !['admin', 'editor', 'writer'].includes(session.role)
  ) {
    redirect('/admin/login')
  }
  if (!(await verifyProfileActive(session.userId))) {
    redirect('/admin/login')
  }
  return session
}

/**
 * Require admin or editor role. Writer tidak boleh akses.
 * Use for halaman moderasi komentar, manage semua artikel.
 */
export async function requireEditor(): Promise<Session> {
  const session = await getSession()
  if (!session || !['admin', 'editor'].includes(session.role)) {
    redirect('/admin/login?error=forbidden')
  }
  if (!(await verifyProfileActive(session.userId))) {
    redirect('/admin/login')
  }
  return session
}

/**
 * Require admin role only. Editor & writer tidak boleh akses.
 * Use for halaman users, settings, categories, tags, faq, subscribers.
 */
export async function requireSuperAdmin(): Promise<Session> {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    redirect('/admin/login?error=forbidden')
  }
  if (!(await verifyProfileActive(session.userId))) {
    redirect('/admin/login')
  }
  return session
}
