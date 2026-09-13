import { LandingHeader } from '@/components/landing/landing-header'
import { Hero } from '@/components/landing/hero'
import { About } from '@/components/landing/about'
import { Education } from '@/components/landing/education'
import { Packages } from '@/components/landing/packages'
import { LatestArticles } from '@/components/landing/latest-articles'
import { SectionDivider } from '@/components/landing/section-divider'
import { FloatingAdminButton } from '@/components/landing/floating-admin-button'

// Always render at request time (runtime) — Vercel injects env vars at
// runtime, not build time. force-dynamic prevents build-time DB queries
// that would fail when SUPABASE_URL / DATABASE_URL aren't available during
// the "Collecting page data" build phase.
export const dynamic = 'force-dynamic'
// Revalidate hint (ignored when force-dynamic, kept for documentation).
export const revalidate = 0

/**
 * Landing page "Peredam Mobil Jakarta" — root route `/`.
 *
 * 5 section + divider line sederhana antar section:
 *  1. Hero             — banner gambar lengkap (sudah berisi judul, subtitle, icon)
 *  2. About            — "About me" + lorem ipsum 100 karakter
 *  3. Jenis Bahan      — 4 jenis material peredam (Butyl, Absorber, Spant, Nex)
 *  4. Paket Layanan    — 4 paket jasa (tanpa CTA WA per card)
 *  5. Artikel Terbaru  — 4 artikel terbaru dari DB
 *
 * Floating button "Hubungi Admin" fixed di pojok kanan bawah (selalu visible).
 *
 * Footer simpel 1 baris (kontak + alamat + copyright).
 */
export default async function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />

      <main className="flex-1">
        {/* Section 1: Hero (gambar saja) */}
        <Hero />

        {/* Divider: Hero → About */}
        <SectionDivider variant="line" />

        {/* Section 2: About (judul + lorem ipsum) */}
        <About />

        {/* Divider: About → Jenis Bahan */}
        <SectionDivider variant="line" />

        {/* Section 3: Jenis Bahan Peredam & Fungsinya */}
        <Education />

        {/* Divider: Jenis Bahan → Paket */}
        <SectionDivider variant="line" />

        {/* Section 4: Paket Layanan */}
        <Packages />

        {/* Divider: Paket → Artikel */}
        <SectionDivider variant="line" />

        {/* Section 5: Artikel Terbaru (vertical list seperti versi lama) */}
        <LatestArticles />
      </main>

      {/* Floating button "Hubungi Admin" — selalu visible di pojok kanan bawah */}
      <FloatingAdminButton />

      {/* Footer simpel 1 baris */}
      <footer className="bg-slate-950 text-slate-300 py-6 mt-auto">
        <div className="container mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2 text-center sm:text-left">
            <span className="font-bold text-brand-light">Peredam Mobil Jakarta</span>
            <span className="hidden sm:inline text-slate-500">·</span>
            <span className="text-slate-400 text-xs sm:text-sm">
              Jl. Taman Surya Blvd 3 Blok H1 No.9, Kalideres, Jakarta Barat 11830
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <a href="tel:082211122989" className="hover:text-brand-light transition-colors">
              0822-1122-2989
            </a>
            <a
              href="mailto:innovationcaraudio@gmail.com"
              className="hover:text-brand-light transition-colors"
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
