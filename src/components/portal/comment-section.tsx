'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Loader2, MessageSquare, Send, Mail, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

type Comment = {
  id: string
  authorName: string
  content: string
  createdAt: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Section komentar untuk halaman artikel detail.
 *
 * - GET /api/comments?articleId=... saat mount untuk fetch approved comments.
 * - POST /api/comments body { articleId, name, email, content } → status PENDING.
 * - Setelah submit sukses → tampilkan info banner "menunggu moderasi".
 */
export function CommentSection({
  articleId,
  initialComments = [],
}: {
  articleId: string
  initialComments?: Comment[]
}) {
  const [comments, setComments] = React.useState<Comment[]>(initialComments)
  const [loading, setLoading] = React.useState(false)
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [content, setContent] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [pendingNote, setPendingNote] = React.useState<string | null>(null)

  // Initial comments dari server (already approved) — tampilkan langsung.
  // Bila kosong dan articleId berubah, tetap pakai initial.

  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch(`/api/comments?articleId=${encodeURIComponent(articleId)}`, {
        cache: 'no-store',
      })
      if (!res.ok) return
      const data = (await res.json()) as { items?: Comment[]; ok?: boolean }
      if (data.items) setComments(data.items)
    } catch {
      // swallow
    } finally {
      setLoading(false)
    }
  }

  // Refresh on mount (server-render initial bisa lebih lama dari komentar baru).
  React.useEffect(() => {
    refresh()
  }, [articleId])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const n = name.trim()
    const em = email.trim().toLowerCase()
    const c = content.trim()
    if (!n || n.length < 1 || n.length > 100) {
      toast.error('Nama wajib diisi (1–100 karakter).')
      return
    }
    if (!em || !EMAIL_RE.test(em)) {
      toast.error('Email tidak valid.')
      return
    }
    if (!c || c.length < 1 || c.length > 2000) {
      toast.error('Komentar wajib diisi (maks 2000 karakter).')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          name: n,
          email: em,
          content: c,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        message?: string
      }
      if (!res.ok || !data.ok) {
        const msg = data.message || 'Gagal mengirim komentar.'
        toast.error(msg)
        return
      }
      // Sukses — bersihkan form, tampilkan note.
      setContent('')
      setName('')
      setEmail('')
      setPendingNote(
        'Komentar Anda terkirim dan menunggu moderasi admin. Terima kasih!',
      )
      toast.success('Komentar terkirim! Menunggu moderasi admin.')
      // Refresh comments untuk pastikan list tetap relevan.
      refresh()
    } catch {
      toast.error('Gagal terhubung. Coba lagi nanti.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="inline-flex items-center gap-2 text-xl sm:text-2xl font-bold tracking-tight">
        <MessageSquare className="size-6 text-amber-500" aria-hidden />
        Komentar Pembaca
        {comments.length > 0 && (
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            ({comments.length})
          </span>
        )}
      </h2>

      {/* Approved comments list */}
      <div className="mt-5 space-y-4">
        {loading && comments.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Memuat komentar…
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Belum ada komentar yang disetujui untuk artikel ini. Jadi yang pertama!
          </div>
        ) : (
          comments.map((c) => (
            <article
              key={c.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <header className="flex items-center justify-between gap-3 mb-2">
                <span className="inline-flex items-center gap-2">
                  <span className="grid place-items-center size-8 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold text-sm">
                    {c.authorName.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="font-semibold text-sm">{c.authorName}</span>
                </span>
                <time
                  className="text-xs text-muted-foreground"
                  dateTime={c.createdAt}
                >
                  {formatTanggalWaktu(new Date(c.createdAt))}
                </time>
              </header>
              <p className="text-sm leading-7 whitespace-pre-wrap">{c.content}</p>
            </article>
          ))
        )}
      </div>

      {/* Submit form */}
      <div className="mt-8">
        <h3 className="font-semibold text-base mb-1">Tinggalkan Komentar</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Email Anda tidak akan dipublikasikan. Komentar akan dimoderasi admin sebelum tampil.
        </p>
        {pendingNote && (
          <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {pendingNote}
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cmt-name" className="text-sm font-medium">
                Nama <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="cmt-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama tampilan"
                  maxLength={100}
                  disabled={submitting}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cmt-email" className="text-sm font-medium">
                Email <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="cmt-email"
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@anda.com"
                  maxLength={254}
                  disabled={submitting}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cmt-content" className="text-sm font-medium">
              Komentar <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="cmt-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tulis komentar Anda…"
              rows={5}
              maxLength={2000}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/2000
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button
              type="submit"
              disabled={submitting}
              className="min-w-[140px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Mengirim…
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Kirim Komentar
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </section>
  )
}

/** Format "5 Sep 2026, 09.30 WIB". */
function formatTanggalWaktu(date: Date): string {
  const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des',
  ]
  const d = new Date(date)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${hh}.${mm} WIB`
}
