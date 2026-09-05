'use client'

import * as React from 'react'
import { toast } from 'sonner'

/**
 * Komponen kecil yang POST /api/articles/[slug]/view sekali per session.
 *
 * Strategy: gunakan sessionStorage key `viewed:${slug}` untuk mencegah double-count
 * saat user reload halaman dalam session yang sama.
 *
 * Komponen ini render null (no UI). Ditempatkan di article detail page.
 */
export function ViewTracker({ slug }: { slug: string }) {
  React.useEffect(() => {
    if (!slug) return
    const key = `viewed:${slug}`
    try {
      if (typeof window === 'undefined') return
      if (window.sessionStorage.getItem(key)) return
      window.sessionStorage.setItem(key, '1')
    } catch {
      // sessionStorage mungkin diblokir (private mode) — fire saja sekali.
    }
    // Fire & forget — tidak perlu tunggu hasil.
    fetch(`/api/articles/${encodeURIComponent(slug)}/view`, {
      method: 'POST',
      keepalive: true,
    }).catch(() => {
      // Swallow error — view tracking best-effort.
    })
  }, [slug])
  return null
}

/**
 * Share buttons — WhatsApp, Facebook, Twitter, Copy link.
 */
export function ShareButtons({
  url,
  title,
}: {
  url: string
  title: string
}) {
  const [copied, setCopied] = React.useState(false)
  const shareText = `${title} — via Peredam Mobil Jakarta`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link disalin ke clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea')
      ta.value = url
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        toast.success('Link disalin!')
        setTimeout(() => setCopied(false), 2000)
      } catch {
        toast.error('Gagal menyalin link. Salin manual: ' + url)
      }
      document.body.removeChild(ta)
    }
  }

  const wa = `https://wa.me/?text=${encodeURIComponent(shareText + '\n' + url)}`
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&t=${encodeURIComponent(shareText)}`
  const tw = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground mr-1">
        Bagikan:
      </span>
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 text-sm font-medium transition-colors"
        aria-label="Bagikan ke WhatsApp"
      >
        <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M.057 24l1.687-6.163c-1.041-1.8-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413z" />
        </svg>
        WhatsApp
      </a>
      <a
        href={fb}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm font-medium transition-colors"
        aria-label="Bagikan ke Facebook"
      >
        <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        Facebook
      </a>
      <a
        href={tw}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-slate-100 text-white dark:text-slate-900 px-3 py-1.5 text-sm font-medium transition-colors"
        aria-label="Bagikan ke Twitter/X"
      >
        <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Twitter
      </a>
      <button
        type="button"
        onClick={copyLink}
        className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
          copied
            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
            : 'border-border bg-background hover:bg-muted'
        }`}
        aria-label="Salin link"
      >
        {copied ? (
          <>
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Disalin
          </>
        ) : (
          <>
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
            Salin link
          </>
        )}
      </button>
    </div>
  )
}
