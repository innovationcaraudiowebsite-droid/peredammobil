'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * Form pencarian untuk halaman /pencarian.
 * Sinkron dengan URL query param `q`.
 */
export function SearchForm({ initialQuery = '' }: { initialQuery?: string }) {
  const router = useRouter()
  const sp = useSearchParams()
  const [q, setQ] = React.useState(initialQuery)

  // Sync state jika URL ?q berubah dari sumber lain (mis. klik tag).
  React.useEffect(() => {
    setQ(sp.get('q') || '')
  }, [sp])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = q.trim()
    if (!trimmed) {
      router.push('/pencarian')
      return
    }
    router.push(`/pencarian?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari: peredam pintu, DSP, workshop jakarta…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 pr-9 h-11"
            aria-label="Cari artikel"
            autoFocus
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ('')
                router.push('/pencarian')
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 size-6 grid place-items-center rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              aria-label="Hapus pencarian"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Button type="submit" className="h-11 px-5">
          Cari
        </Button>
      </div>
    </form>
  )
}

/** Loading skeleton untuk hasil pencarian. */
export function SearchSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 rounded-lg border border-border bg-card p-4 animate-pulse"
        >
          <div className="size-20 rounded-md bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        </div>
      ))}
      <div className="grid place-items-center text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span className="ml-2">Mencari…</span>
      </div>
    </div>
  )
}
