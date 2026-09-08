'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Search, Loader2, ArrowRight } from 'lucide-react'
import { formatTanggalPendek, formatNumber } from '@/lib/format-tanggal'

type SearchHit = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  category: { name: string; slug: string; color: string | null }
  publishedAt: string | null
  viewCount: number
}

const DEBOUNCE_MS = 250

export function SearchDialog({ children }: { children?: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState('')
  const [hits, setHits] = React.useState<SearchHit[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const abortRef = React.useRef<AbortController | null>(null)

  // Debounced search query.
  React.useEffect(() => {
    if (!open) return
    const query = q.trim()
    if (!query) {
      setHits([])
      setLoading(false)
      setError(null)
      if (abortRef.current) {
        abortRef.current.abort()
        abortRef.current = null
      }
      return
    }
    setLoading(true)
    setError(null)
    const handle = setTimeout(async () => {
      try {
        if (abortRef.current) abortRef.current.abort()
        const ac = new AbortController()
        abortRef.current = ac
        const url = `/api/search?q=${encodeURIComponent(query)}&take=8`
        const res = await fetch(url, { signal: ac.signal })
        if (!res.ok) throw new Error('Gagal mencari')
        const data = (await res.json()) as { items: SearchHit[]; total: number }
        setHits(data.items || [])
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
        setError('Gagal mencari. Coba lagi.')
        setHits([])
      } finally {
        setLoading(false)
      }
    }, DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [q, open])

  // Keyboard shortcut: Cmd/Ctrl+K to open
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function gotoSearchPage() {
    const query = q.trim()
    if (!query) return
    setOpen(false)
    router.push(`/pencarian?q=${encodeURIComponent(query)}`)
  }

  function openArticle(hit: SearchHit) {
    setOpen(false)
    router.push(`/berita/${hit.category.slug}/${hit.slug}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <button
            type="button"
            aria-label="Cari artikel"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Search className="size-4" />
            <span className="hidden sm:inline">Cari artikel…</span>
            <kbd className="hidden sm:inline ml-1 rounded border border-border bg-muted px-1.5 text-[10px] font-mono">
              ⌘K
            </kbd>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl top-[15%] translate-y-0 p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Cari artikel</DialogTitle>
          <DialogDescription>
            Cari artikel peredam mobil & upgrade audio di Jakarta.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            type="text"
            placeholder="Ketik kata kunci — mis. peredam pintu, DSP, workshop jakarta…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') gotoSearchPage()
            }}
            className="border-0 shadow-none focus-visible:ring-0 px-0 h-9"
            aria-label="Kata kunci pencarian"
          />
          {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto portal-scroll">
          {error && (
            <div className="p-4 text-sm text-rose-500">{error}</div>
          )}
          {!error && !q.trim() && (
            <div className="p-6 text-sm text-muted-foreground text-center">
              Ketik kata kunci untuk mencari artikel di portal Peredam Mobil Jakarta.
            </div>
          )}
          {!error && q.trim() && !loading && hits.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground text-center">
              Tidak ada hasil untuk &quot;<span className="font-medium text-foreground">{q.trim()}</span>&quot;.
            </div>
          )}
          {hits.length > 0 && (
            <ul className="divide-y divide-border">
              {hits.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => openArticle(h)}
                    className="group w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            {h.category.name}
                          </span>
                          {h.publishedAt && (
                            <span className="text-[11px] text-muted-foreground">
                              {formatTanggalPendek(h.publishedAt)}
                            </span>
                          )}
                        </div>
                        <h4 className="font-medium text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                          {h.title}
                        </h4>
                        {h.excerpt && (
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                            {h.excerpt}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary mt-0.5" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {q.trim() && (
          <div className="border-t border-border px-4 py-2.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {loading ? 'Mencari…' : hits.length > 0 ? `${formatNumber(hits.length)} hasil` : ''}
            </span>
            <Link
              href={`/pencarian?q=${encodeURIComponent(q.trim())}`}
              onClick={() => setOpen(false)}
              className="font-medium text-primary hover:underline"
            >
              Lihat semua hasil →
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
