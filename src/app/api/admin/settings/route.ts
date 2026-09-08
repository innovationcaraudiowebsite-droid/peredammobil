import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

const ALLOWED_COLORS = ['amber', 'red', 'emerald', 'slate', 'zinc', 'violet', 'rose', 'cyan']

interface SettingFields {
  siteName?: unknown
  tagline?: unknown
  logoUrl?: unknown
  faviconUrl?: unknown
  contactEmail?: unknown
  contactAddress?: unknown
  contactPhone?: unknown
  socialFacebook?: unknown
  socialInstagram?: unknown
  socialYoutube?: unknown
  authorName?: unknown
  newsletterHeadline?: unknown
  newsletterSubtext?: unknown
  footerCopyright?: unknown
  primaryColor?: unknown
}

function asString(v: unknown, max?: number): string | undefined {
  if (typeof v !== 'string') return undefined
  const trimmed = v.trim()
  if (trimmed === '') return undefined
  return max ? trimmed.slice(0, max) : trimmed
}

function asNullableString(v: unknown, max?: number): string | null {
  const trimmed = asString(v, max)
  return trimmed ?? null
}

/**
 * GET /api/admin/settings — return SiteSetting singleton.
 * Jika belum ada di DB, upsert default (id="global") lalu return.
 */
export async function GET() {
  await requireAdmin()

  const setting = await db.siteSetting.upsert({
    where: { id: 'global' },
    update: {},
    create: { id: 'global' },
  })

  return NextResponse.json({ ok: true, setting })
}

/**
 * PUT /api/admin/settings — update semua field SiteSetting.
 * Body: partial fields. primaryColor divalidasi terhadap whitelist.
 */
export async function PUT(req: NextRequest) {
  await requireAdmin()

  let body: SettingFields
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Body tidak valid.' }, { status: 400 })
  }

  const data: { [k: string]: unknown } = {}

  // Branding
  if (body.siteName !== undefined) {
    const v = asString(body.siteName, 120)
    if (!v) {
      return NextResponse.json(
        { ok: false, message: 'siteName wajib diisi.' },
        { status: 400 },
      )
    }
    data.siteName = v
  }
  if (body.tagline !== undefined) {
    data.tagline = asNullableString(body.tagline, 240) ?? ''
  }
  if (body.logoUrl !== undefined) {
    data.logoUrl = asNullableString(body.logoUrl, 500)
  }
  if (body.faviconUrl !== undefined) {
    data.faviconUrl = asNullableString(body.faviconUrl, 500)
  }
  if (body.primaryColor !== undefined) {
    const c = asString(body.primaryColor, 30)
    if (!c || !ALLOWED_COLORS.includes(c)) {
      return NextResponse.json(
        { ok: false, message: `primaryColor harus salah satu dari: ${ALLOWED_COLORS.join(', ')}.` },
        { status: 400 },
      )
    }
    data.primaryColor = c
  }

  // Kontak
  if (body.contactEmail !== undefined) {
    data.contactEmail = asNullableString(body.contactEmail, 200) ?? ''
  }
  if (body.contactAddress !== undefined) {
    data.contactAddress = asNullableString(body.contactAddress, 500) ?? ''
  }
  if (body.contactPhone !== undefined) {
    data.contactPhone = asNullableString(body.contactPhone, 50)
  }

  // Social
  if (body.socialFacebook !== undefined) {
    data.socialFacebook = asNullableString(body.socialFacebook, 300)
  }
  if (body.socialInstagram !== undefined) {
    data.socialInstagram = asNullableString(body.socialInstagram, 300)
  }
  if (body.socialYoutube !== undefined) {
    data.socialYoutube = asNullableString(body.socialYoutube, 300)
  }

  // Author & Newsletter
  if (body.authorName !== undefined) {
    data.authorName = asNullableString(body.authorName, 120) ?? 'Innovation Car Audio'
  }
  if (body.newsletterHeadline !== undefined) {
    data.newsletterHeadline = asNullableString(body.newsletterHeadline, 120) ?? ''
  }
  if (body.newsletterSubtext !== undefined) {
    data.newsletterSubtext = asNullableString(body.newsletterSubtext, 500) ?? ''
  }

  // Footer
  if (body.footerCopyright !== undefined) {
    data.footerCopyright = asNullableString(body.footerCopyright, 300) ?? ''
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, message: 'Tidak ada field yang diubah.' }, { status: 400 })
  }

  const updated = await db.siteSetting.upsert({
    where: { id: 'global' },
    update: data,
    create: { id: 'global', ...data },
    select: { id: true, updatedAt: true },
  })

  return NextResponse.json({ ok: true, updatedAt: updated.updatedAt.toISOString() })
}
