'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Mail, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * Newsletter subscribe form (Buletin Mingguan).
 *
 * - POST /api/subscribe body { email }
 * - Tampilkan toast sukses/error via sonner
 * - Setelah sukses tampilkan state terima kasih
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function NewsletterForm({
  headline = 'Buletin Mingguan',
  subtext = 'Ringkasan review workshop dan panduan peredam, sekali seminggu.',
  variant = 'default',
}: {
  headline?: string
  subtext?: string
  variant?: 'default' | 'compact' | 'inline'
}) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      toast.error('Email wajib diisi.')
      return
    }
    if (!EMAIL_RE.test(trimmed)) {
      toast.error('Format email tidak valid.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, source: 'homepage' }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        message?: string
        reactivated?: boolean
      }
      if (!res.ok || !data.ok) {
        const msg =
          data.message ||
          (res.status === 429
            ? 'Terlalu banyak percobaan. Coba lagi nanti.'
            : 'Gagal berlangganan. Coba lagi nanti.')
        toast.error(msg)
        return
      }
      // Sukses
      if (data.reactivated) {
        toast.success('Langganan Anda aktif kembali. Terima kasih!')
      } else {
        toast.success('Terima kasih sudah berlangganan!')
      }
      setDone(true)
      setEmail('')
    } catch {
      toast.error('Gagal terhubung ke server. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'inline') {
    if (done) {
      return (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-center">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-4" />
            Terima kasih sudah berlangganan! Cek email Anda untuk konfirmasi.
          </p>
          <button
            type="button"
            className="mt-2 text-xs text-muted-foreground hover:text-foreground hover:underline"
            onClick={() => setDone(false)}
          >
            Daftarkan email lain
          </button>
        </div>
      )
    }
    return (
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <Input
          type="email"
          inputMode="email"
          placeholder="email@anda.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          aria-label="Email untuk berlangganan"
          className="flex-1"
        />
        <Button type="submit" disabled={loading} className="shrink-0">
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Mail className="size-4" />
          )}
          Langganan
        </Button>
      </form>
    )
  }

  if (variant === 'compact') {
    if (done) {
      return (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-center">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-4" />
            Berlangganan berhasil. Terima kasih!
          </p>
        </div>
      )
    }
    return (
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          type="email"
          inputMode="email"
          placeholder="email@anda.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          aria-label="Email untuk berlangganan"
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Mail className="size-4" />
          )}
          Berlangganan Gratis
        </Button>
      </form>
    )
  }

  // default — card style untuk sidebar
  return (
    <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-card p-5">
      <h3 className="inline-flex items-center gap-2 font-bold text-base">
        <Mail className="size-5 text-amber-500" aria-hidden />
        {headline}
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{subtext}</p>
      {done ? (
        <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-center">
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-4" />
            Terima kasih sudah berlangganan!
          </p>
          <button
            type="button"
            className="mt-2 text-xs text-muted-foreground hover:text-foreground hover:underline"
            onClick={() => setDone(false)}
          >
            Daftarkan email lain
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-2">
          <Input
            type="email"
            inputMode="email"
            placeholder="email@anda.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            aria-label="Email untuk berlangganan"
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Mail className="size-4" />
            )}
            Berlangganan Gratis
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            Gratis · hanya 1 email per minggu · berhenti kapan saja
          </p>
        </form>
      )}
    </div>
  )
}
