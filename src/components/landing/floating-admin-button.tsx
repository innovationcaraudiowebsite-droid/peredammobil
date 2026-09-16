'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'

/**
 * WhatsAppIcon — logo resmi WhatsApp Business (phone-in-speech-bubble).
 * Inline SVG supaya tidak perlu library tambahan. fill='currentColor'
 * supaya ikut warna parent (text-white di button emerald).
 */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.366.195 1.881.118.574-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.354.101 11.892c0 2.096.549 4.142 1.595 5.951L0 24l6.304-1.654a11.882 11.882 0 005.684 1.448h.005c6.582 0 11.942-5.353 11.945-11.893 0-3.18-1.237-6.165-3.485-8.413" />
    </svg>
  )
}

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
                  <WhatsAppIcon className="size-4 shrink-0" />
                  <span className="flex-1">{s.label}</span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">{s.display}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main button — logo WA resmi, lingkaran sempurna (size-16 = 64×64, rounded-full = circle) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group grid size-16 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/40 transition-all hover:scale-110 hover:shadow-xl hover:shadow-emerald-500/50 active:scale-95"
        aria-label="Chat WhatsApp Sales"
        aria-expanded={open}
      >
        <WhatsAppIcon className="size-8 shrink-0" />
      </button>
    </div>
  )
}
