import { LandingHeader } from '@/components/landing/landing-header'
import { Hero } from '@/components/landing/hero'
import { About } from '@/components/landing/about'
import { Education } from '@/components/landing/education'
import { Packages } from '@/components/landing/packages'
import { LatestArticles } from '@/components/landing/latest-articles'
import { SectionDivider } from '@/components/landing/section-divider'
import { LandingFooter } from '@/components/landing/landing-footer'

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
 *  4. Paket Layanan    — 4 paket jasa (4 Pintu, Full Kabin, Kap Mesin, Wheel Housing)
 *  5. Artikel Terbaru  — carousel semua artikel (pre-load 30, slide animation)
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

        {/* Section 5: Artikel Terbaru (carousel — pre-load all, slide animation) */}
        <LatestArticles />
      </main>

      {/* Floating button "Chat WA Sales" — di layout.tsx global */}

      {/* Footer simpel 1 baris (komponen shared supaya konsisten di semua halaman) */}
      <LandingFooter />
    </div>
  )
}
