import 'server-only'
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { db } from '@/lib/db'

const COOKIE_NAME = 'admin_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * Get Supabase env vars (parse .env manually for sandbox compatibility).
 * Same logic as supabase-server.ts pickEnv().
 */
function requireSupabaseEnv(): { url: string; secretKey: string } {
  const getKey = (key: string): string => {
    const fromProcess = process.env[key]
    if (fromProcess && !fromProcess.startsWith('file:')) return fromProcess
    // Fall back to .env file
    try {
      const text = fs.readFileSync(process.cwd() + '/.env', 'utf-8')
      for (const raw of text.split('\n')) {
        const m = /^([A-Z_][A-Z0-9_]*)\s*=\s*"?(.+?)"?\s*$/.exec(raw.trim())
        if (m && m[1] === key) return m[2].split(/\s+#/)[0]
      }
    } catch {}
    return ''
  }
  const url = getKey('SUPABASE_URL')
  const secretKey = getKey('SUPABASE_SECRET_KEY')
  if (!url || !secretKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY')
  }
  return { url, secretKey }
}

/**
 * Create a fresh Supabase client (no cached session) — used after
 * signInWithPassword to avoid session bleed into DB queries.
 */
function createClientFresh(url: string, secretKey: string) {
  return createSupabaseClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } },
  })
}

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
    // Client 1: for auth verification only
    const authClient = getSupabaseAdmin()
    const { data, error } = await authClient.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error || !data.user) {
      console.error('[auth] signInWithPassword failed:', error?.message)
      return null
    }


    // Client 2: fresh client for DB query (signInWithPassword sets session in
    // memory, which makes subsequent queries use user token instead of
    // service_role — RLS then blocks the query)
    const { url, secretKey } = requireSupabaseEnv()
    const dbClient = createClientFresh(url, secretKey)

    // Profile lookup using fresh client
    const { data: profileData, error: profileErr } = await dbClient
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    let profile = profileData as { id: string; email: string; role: string; isActive: boolean } | null
    
    if (!profile && profileErr && profileErr.code !== 'PGRST116') {
      console.error('[auth] profile lookup error:', profileErr.message)
    }
    
    if (!profile) {
      // Profile belum ada — create manual
      try {
        const { data: created, error: createErr } = await dbClient
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email || email.trim().toLowerCase(),
            role: 'writer',
            isActive: true,
          })
          .select()
          .single()
        if (createErr) throw new Error(createErr.message)
        profile = created as { id: string; email: string; role: string; isActive: boolean }
      } catch (e) {
        console.error('[auth] profile not found & create failed:', e)
        return null
      }
    }
    if (!profile.isActive) {
      console.error('[auth] user is inactive:', profile.email)
      return null
    }

    // Update lastLoginAt (fire & forget)
    dbClient
      .from('profiles')
      .update({ lastLoginAt: new Date().toISOString() })
      .eq('id', profile.id)
      .then(() => {})
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
