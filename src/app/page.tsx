import { LandingHeader } from '@/components/landing/landing-header'
import { Hero } from '@/components/landing/hero'
import { About } from '@/components/landing/about'
import { Education } from '@/components/landing/education'
import { Packages } from '@/components/landing/packages'
import { LatestArticles } from '@/components/landing/latest-articles'
import { SectionDivider } from '@/components/landing/section-divider'

// Always render at request time (runtime) — Vercel injects env vars at
// runtime, not build time. force-dynamic prevents build-time DB queries
// that would fail when SUPABASE_URL / DATABASE_URL aren't available during
// the "Collecting page data" build phase.
export const dynamic = 'force-dynamic'
// Revalidate hint (ignored when force-dynamic, kept for documentation).
export const revalidate = 0

/**
 * Landing page workshop "Innovation Car Audio" — root route `/`.
 *
 * 5 section + dividers:
 *  1. Hero             — headline, subtitle, CTA WhatsApp + Lihat Paket, trust badges
 *  2. About            — foto AI, teks, 4 stat cards, spesialisasi
 *  3. Edukasi          — 3 card (Kenapa Peredam, Cara Memilih, Tips & Biaya)
 *  4. Paket            — 7 produk card (Gran Turismo, Infinity, Rainbow, Silent Coat)
 *  5. Artikel Terbaru  — 4 card vertical list dari DB
 *
 * Dividers:
 *  Hero → About:       gradient line (dark → dark)
 *  About → Edukasi:    wave SVG (dark → light)
 *  Edukasi → Paket:    gradient line (light → light)
 *  Paket → Artikel:    gradient line (light → light)
 *  Artikel → Footer:   wave SVG (light → dark)
 *
 * Footer simpel 1 baris (kontak + alamat + copyright).
 */
export default async function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />

      <main className="flex-1">
        {/* Section 1: Hero (dark bg) */}
        <Hero />

        {/* Divider: Hero → About (dark → dark, gradient line) */}
        <SectionDivider variant="line" />

        {/* Section 2: About (dark bg) */}
        <About />

        {/* Divider: About → Edukasi (dark → light, wave SVG) */}
        <SectionDivider variant="wave-down" />

        {/* Section 3: Edukasi (light bg) */}
        <Education />

        {/* Divider: Edukasi → Paket (light → light, gradient line) */}
        <SectionDivider variant="line" />

        {/* Section 4: Paket (light bg) */}
        <Packages />

        {/* Divider: Paket → Artikel (light → light, gradient line) */}
        <SectionDivider variant="line" />

        {/* Section 5: Artikel (light bg) */}
        <LatestArticles />

        {/* Divider: Artikel → Footer (light → dark, wave SVG) */}
        <SectionDivider variant="wave-up" />
      </main>

      {/* Footer simpel 1 baris */}
      <footer className="bg-slate-950 text-slate-300 py-6 mt-auto">
        <div className="container mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2 text-center sm:text-left">
            <span className="font-bold text-amber-500">Innovation Car Audio</span>
            <span className="hidden sm:inline text-slate-500">·</span>
            <span className="text-slate-400 text-xs sm:text-sm">
              Jl. Taman Surya Blvd 3 Blok H1 No.9, Kalideres, Jakarta Barat 11830
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <a href="tel:082211122989" className="hover:text-amber-400 transition-colors">
              0822-1122-2989
            </a>
            <a
              href="mailto:innovationcaraudio@gmail.com"
              className="hover:text-amber-400 transition-colors"
            >
              innovationcaraudio@gmail.com
            </a>
            <span className="text-slate-500">© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
