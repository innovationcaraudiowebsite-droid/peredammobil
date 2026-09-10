/**
 * Landing page image URLs (Supabase Storage).
 *
 * Gambar di-generate via AI (z-ai-web-dev-sdk images.generations.create)
 * dan di-upload ke bucket 'site-assets' folder 'landing/'.
 *
 * Untuk re-generate: bun run src/scripts/gen-one-image.ts <name>
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const BASE = `${SUPABASE_URL}/storage/v1/object/public/site-assets/landing`

export const landingImages = {
  /** Hero background (full-bleed, dramatic cinematic) */
  heroBg: `${BASE}/landing-hero-bg.webp`,
  /** Hero image (used in old layout, kept for reference) */
  hero: `${BASE}/landing-hero.webp`,
  /** About section image */
  about: `${BASE}/landing-about.webp`,
  /** Edukasi card images */
  edu: {
    kenapaPeredam: `${BASE}/edu-kenapa-peredam.webp`,
    caraMemilih: `${BASE}/edu-cara-memilih.webp`,
    tipsBiaya: `${BASE}/edu-tips-biaya.webp`,
  },
  /** Paket produk images */
  paket: {
    granTurismo18mm: `${BASE}/paket-gran-turismo-1-8mm.webp`,
    granTurismo2mm: `${BASE}/paket-gran-turismo-2mm.webp`,
    infinity: `${BASE}/paket-infinity.webp`,
    rainbow2mm: `${BASE}/paket-rainbow-2mm.webp`,
    rainbow35mm: `${BASE}/paket-rainbow-3-5mm.webp`,
    rainbow4mm: `${BASE}/paket-rainbow-4mm.webp`,
    silentCoat2mm: `${BASE}/paket-silent-coat-2mm.webp`,
  },
} as const

/**
 * Get image URL for a package by slug (matches paket data in packages.tsx).
 */
export function paketImageUrl(slug: string): string {
  const map: Record<string, string> = {
    'gran-turismo-1-8mm': landingImages.paket.granTurismo18mm,
    'gran-turismo-2mm': landingImages.paket.granTurismo2mm,
    'infinity': landingImages.paket.infinity,
    'rainbow-2mm': landingImages.paket.rainbow2mm,
    'rainbow-3-5mm': landingImages.paket.rainbow35mm,
    'rainbow-4mm': landingImages.paket.rainbow4mm,
    'silent-coat-2mm': landingImages.paket.silentCoat2mm,
  }
  return map[slug] || landingImages.paket.granTurismo18mm
}

/**
 * Get image URL for an education card by slug.
 */
export function eduImageUrl(slug: string): string {
  const map: Record<string, string> = {
    'kenapa-peredam': landingImages.edu.kenapaPeredam,
    'cara-memilih': landingImages.edu.caraMemilih,
    'tips-biaya': landingImages.edu.tipsBiaya,
  }
  return map[slug] || landingImages.edu.kenapaPeredam
}
