'use client'

/**
 * Global error boundary — Next.js 16 convention.
 *
 * Catches any unhandled server component error and shows a friendly
 * fallback instead of the default "Application error: a server-side
 * exception has occurred" message.
 *
 * This is a client component (Next.js error boundary must be client).
 */

import { useEffect } from 'react'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to console for Vercel to pick up
    console.error('[GlobalErrorBoundary]', error)
  }, [error])

  return (
    <html lang="id">
      <body className="min-h-screen bg-background text-foreground antialiased flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto inline-flex items-center justify-center size-16 rounded-full bg-amber-500/10 text-amber-500">
            <AlertCircle className="size-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Halaman Tidak Dapat Dimuat
            </h1>
            <p className="text-muted-foreground leading-7">
              Terjadi kesalahan saat memuat halaman. Ini biasanya terjadi
              karena koneksi database sedang bermasalah atau halaman sedang
              diperbarui.
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground/60 font-mono">
                Kode error: {error.digest}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
            >
              <RefreshCw className="size-4" />
              Coba Lagi
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              <Home className="size-4" />
              Kembali ke Beranda
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
