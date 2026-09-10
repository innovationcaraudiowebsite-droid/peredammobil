'use client'

/**
 * Route-level error boundary — catches errors from server components
 * within the same route segment (homepage, article, category, etc.).
 *
 * Next.js 16 convention: 'error.tsx' must be a client component.
 * Falls back to a friendly message + retry button instead of the
 * raw "Application error" page.
 */

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[RouteError]', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto inline-flex items-center justify-center size-14 rounded-full bg-amber-500/10 text-amber-500">
          <AlertCircle className="size-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">
            Gagal Memuat Konten
          </h2>
          <p className="text-sm text-muted-foreground leading-6">
            Kami sedang mengalami masalah teknis. Silakan coba muat ulang
            halaman, atau kembali ke beranda.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/60 font-mono pt-1">
              {error.digest}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
          >
            <RefreshCw className="size-4" />
            Muat Ulang
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Home className="size-4" />
            Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
