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
  hero: `${BASE}/landing-hero.webp`,
  about: `${BASE}/landing-about.webp`,
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
