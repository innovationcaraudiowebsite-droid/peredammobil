import 'server-only'
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

const COOKIE_NAME = 'admin_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret || secret.length < 16) {
    throw new Error('ADMIN_SESSION_SECRET is missing or too short (min 16 chars).')
  }
  return secret
}

function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL ?? ''
}

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? ''
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

/**
 * Verify admin credentials against env vars.
 * Constant-time comparison to mitigate timing attacks.
 */
export async function login(email: string, password: string): Promise<boolean> {
  const expectedEmail = getAdminEmail()
  const expectedPassword = getAdminPassword()
  if (!expectedEmail || !expectedPassword) {
    return false
  }
  // Constant-time comparison for both fields
  const emailOk = safeEqual(email.trim().toLowerCase(), expectedEmail.toLowerCase())
  const passOk = safeEqual(password, expectedPassword)
  return emailOk && passOk
}

interface SessionPayload {
  email: string
  exp: number
  nonce?: string
}

/**
 * Create a JWT-like signed token: base64url(payload).base64url(hmacSignature)
 */
export function createSessionToken(): string {
  const secret = getSecret()
  const email = getAdminEmail()
  const payload: SessionPayload = {
    email,
    exp: Date.now() + SESSION_TTL_MS,
    nonce: randomBytes(8).toString('hex'),
  }
  const payloadB64 = base64url(JSON.stringify(payload))
  const sig = createHmac('sha256', secret).update(payloadB64).digest()
  const sigB64 = base64url(sig)
  return `${payloadB64}.${sigB64}`
}

/**
 * Verify token signature & expiration.
 * Returns true if valid & not expired.
 */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token || typeof token !== 'string') return false
  if (!token.includes('.')) return false
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [payloadB64, sigB64] = parts

  const secret = getSecret()
  const expectedSig = createHmac('sha256', secret).update(payloadB64).digest()
  const receivedSig = fromBase64url(sigB64)

  if (expectedSig.length !== receivedSig.length) return false
  if (!timingSafeEqual(expectedSig, receivedSig)) return false

  // Decode & check exp
  let payload: SessionPayload
  try {
    payload = JSON.parse(fromBase64url(payloadB64).toString('utf8'))
  } catch {
    return false
  }
  if (!payload || typeof payload.exp !== 'number') return false
  if (Date.now() > payload.exp) return false
  // Also ensure email matches current admin email (so changing env invalidates old sessions)
  if (payload.email !== getAdminEmail()) return false
  return true
}

function decodePayload(token: string): SessionPayload | null {
  try {
    const [payloadB64] = token.split('.')
    return JSON.parse(fromBase64url(payloadB64).toString('utf8'))
  } catch {
    return null
  }
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

/**
 * Read session from next/headers cookies. Returns payload or null.
 */
export async function getSession(): Promise<{ email: string } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const valid = await verifySessionToken(token)
  if (!valid || !token) return null
  const payload = decodePayload(token)
  if (!payload) return null
  return { email: payload.email }
}

/**
 * Server-component helper. Throws redirect to /admin/login if not authenticated.
 */
export async function requireAdmin(): Promise<{ email: string }> {
  const session = await getSession()
  if (!session) {
    redirect('/admin/login')
  }
  return session
}
