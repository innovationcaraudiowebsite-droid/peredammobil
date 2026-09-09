import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'admin_session'
const PUBLIC_PATHS = ['/admin/login']

/**
 * Decode a base64url string into an ArrayBuffer (works in Edge & Node runtime).
 */
function base64urlToBuffer(input: string): ArrayBuffer {
  const pad = '='.repeat((4 - (input.length % 4)) % 4)
  const b64 = (input + pad).replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

/**
 * Inline token verification using Web Crypto API (Edge-compatible).
 * Mirrors HMAC-SHA256 logic in src/lib/auth.ts (which uses node:crypto).
 */
async function verifyToken(token: string | undefined): Promise<boolean> {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [payloadB64, sigB64] = parts

  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret || secret.length < 16) return false

  let key: CryptoKey
  try {
    key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    )
  } catch {
    return false
  }

  let valid: boolean
  try {
    valid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64urlToBuffer(sigB64),
      new TextEncoder().encode(payloadB64),
    )
  } catch {
    return false
  }
  if (!valid) return false

  let payload: { userId?: string; email?: string; role?: string; exp?: number }
  try {
    const pad = '='.repeat((4 - (payloadB64.length % 4)) % 4)
    const b64 = (payloadB64 + pad).replace(/-/g, '+').replace(/_/g, '/')
    payload = JSON.parse(atob(b64))
  } catch {
    return false
  }
  if (!payload || typeof payload.exp !== 'number') return false
  if (Date.now() > payload.exp) return false
  if (!payload.userId || !payload.role) return false
  // Must be one of valid roles
  if (!['admin', 'editor', 'writer'].includes(payload.role)) return false
  return true
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Public admin paths (login page + its sub-paths if any)
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!(await verifyToken(token))) {
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  // Protect everything under /admin/* except /admin/login (handled above)
  matcher: ['/admin/:path*'],
}
