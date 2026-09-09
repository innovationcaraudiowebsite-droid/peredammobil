import Link from 'next/link'
import { Home, Search, FileQuestion } from 'lucide-react'

/**
 * Custom 404 page — shown when a route doesn't exist or article not found.
 * Next.js 16 convention: 'not-found.tsx' at the root catches all 404s.
 */

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto inline-flex items-center justify-center size-16 rounded-full bg-amber-500/10 text-amber-500">
          <FileQuestion className="size-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">404</h1>
          <h2 className="text-lg font-semibold">Halaman Tidak Ditemukan</h2>
          <p className="text-sm text-muted-foreground leading-6">
            Halaman yang Anda cari mungkin sudah dipindah, dihapus, atau
            tidak pernah ada. Coba cari artikel lain atau kembali ke beranda.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
          >
            <Home className="size-4" />
            Beranda
          </Link>
          <Link
            href="/pencarian"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Search className="size-4" />
            Cari Artikel
          </Link>
        </div>
      </div>
    </div>
  )
}
