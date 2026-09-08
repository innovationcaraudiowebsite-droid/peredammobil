import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Rate-limit sederhana berbasis in-memory map (per IP, jendela 60 menit).
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const rateMap = new Map<string, { count: number; firstAt: number }>()

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}

function checkRate(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now - entry.firstAt > RATE_LIMIT_WINDOW_MS) {
    rateMap.set(ip, { count: 1, firstAt: now })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count += 1
  return true
}

/**
 * POST /api/subscribe
 * Body: { email: string, source?: string }
 *
 * - Validasi format email.
 * - Rate limit 5 per jam per IP.
 * - Jika email sudah ada:
 *     - status ACTIVE  → return { ok:true, dedupe:true } (tidak duplikasi)
 *     - status UNSUBSCRIBED → re-aktivasi (set ACTIVE, clear unsubscribedAt)
 * - Jika belum ada → create dengan status ACTIVE.
 *
 * Public, no auth. Status default ACTIVE.
 */
export async function POST(req: NextRequest) {
  let body: { email?: unknown; source?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Body JSON tidak valid.' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json(
      { ok: false, message: 'Email tidak valid.' },
      { status: 400 },
    )
  }

  const ip = getClientIp(req)
  if (!checkRate(ip)) {
    return NextResponse.json(
      { ok: false, message: 'Terlalu banyak percobaan. Coba lagi dalam beberapa menit.' },
      { status: 429 },
    )
  }

  const source =
    typeof body.source === 'string' && body.source.length > 0
      ? body.source.slice(0, 64)
      : 'homepage'

  try {
    const existing = await db.subscriber.findUnique({ where: { email } })
    if (existing) {
      if (existing.status === 'ACTIVE') {
        // Idempotent — return success without creating duplicate.
        return NextResponse.json({ ok: true, dedupe: true, message: 'Email sudah berlangganan.' })
      }
      // UNSUBSCRIBED → re-activate.
      await db.subscriber.update({
        where: { id: existing.id },
        data: {
          status: 'ACTIVE',
          unsubscribedAt: null,
          source,
          subscribedAt: new Date(),
        },
      })
      return NextResponse.json({ ok: true, reactivated: true })
    }
    await db.subscriber.create({
      data: {
        email,
        status: 'ACTIVE',
        source,
      },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('subscribe error', err)
    return NextResponse.json(
      { ok: false, message: 'Gagal menyimpan langganan. Coba lagi nanti.' },
      { status: 500 },
    )
  }
}
