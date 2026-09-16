/**
 * LandingFooter — footer sederhana untuk landing page & semua halaman
 * yang pakai LandingHeader (supaya konsisten).
 *
 * 1 baris: brand + alamat + kontak + copyright.
 * Sama dengan footer yang sebelumnya ada di src/app/page.tsx, sekarang
 * dijadikan komponen terpisah supaya bisa dipakai di halaman detail
 * artikel, kategori, search, dll.
 */

export function LandingFooter() {
  return (
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
  )
}
