'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, X } from 'lucide-react'

/**
 * FloatingAdminButton — floating button WhatsApp Sales yang fixed di
 * pojok kanan bawah. Selalu visible saat scroll. Klik → expand panel
 * berisi 2 WA Sales (Sales 1 & Sales 2), user pilih mau chat yang mana.
 *
 * Sesuai brief user revisi:
 *  - Ganti icon Phone (warna coklat brand) → logo WhatsApp (warna hijau
 *    emerald, khas WhatsApp).
 *  - 2 nomor WA Sales:
 *      Sales 1: +62 822-1122-2989 (6282111222989)
 *      Sales 2: +62 812-9595-2279 (6281295952279)
 *  - Panel expand: 2 opsi WA (Sales 1 / Sales 2), langsung buka wa.me.
 *  - Warna: emerald gradient (hijau khas WhatsApp).
 *  - Icon: MessageCircle (logo WA dari lucide-react).
 *
 * Behavior:
 *  - Muncul setelah scroll > 100px (supaya tidak overlap dengan hero).
 *  - Klik button → toggle panel expand.
 *  - Klik salah satu Sales → buka wa.me/<nomor> di tab baru.
 *  - Auto-close saat klik luar panel atau saat scroll.
 */
const WA_SALES = [
  {
    label: 'Sales 1',
    number: '6282111222989', // +62 822-1122-2989
    display: '0822-1122-2989',
  },
  {
    label: 'Sales 2',
    number: '6281295952279', // +62 812-9595-2279
    display: '0812-9595-2279',
  },
] as const

export function FloatingAdminButton() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)

  // Sembunyi di halaman admin (tidak perlu CTA WA di dashboard admin)
  const isAdmin = pathname?.startsWith('/admin') ?? false

  useEffect(() => {
    if (isAdmin) return // skip scroll listener di admin
    const onScroll = () => {
      setVisible(window.scrollY > 100)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [isAdmin])

  // Close saat klik luar panel
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Jangan close jika klik di dalam panel atau button itu sendiri
      if (target.closest('[data-floating-wa]')) return
      setOpen(false)
    }
    // Delay supaya click yang baru saja trigger open tidak langsung close
    const timer = setTimeout(() => {
      document.addEventListener('click', onClick)
    }, 100)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', onClick)
    }
  }, [open])

  const waLinkFor = (number: string) =>
    `https://wa.me/${number}?text=${encodeURIComponent(
      'Halo, saya tertarik paket layanan peredam mobil. Mohon info lengkap.',
    )}`

  // Early return di admin — render nothing (setelah semua hooks dipanggil)
  if (isAdmin) return null

  return (
    <div
      data-floating-wa
      className={`fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      {/* Expand panel — 2 opsi WA Sales */}
      {open && (
        <div className="w-60 rounded-xl border border-border bg-card p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Chat WhatsApp</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Tutup panel"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <ul className="space-y-1.5">
            {WA_SALES.map((s) => (
              <li key={s.label}>
                <a
                  href={waLinkFor(s.number)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-lg border border-border bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                >
                  <MessageCircle className="size-4 shrink-0" />
                  <span className="flex-1">{s.label}</span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">{s.display}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main button — logo WA, warna emerald */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 active:scale-95"
        aria-label="Chat WhatsApp Sales"
        aria-expanded={open}
      >
        <MessageCircle className="size-5 shrink-0" />
        <span className="hidden sm:inline">Chat WA Sales</span>
      </button>
    </div>
  )
}
