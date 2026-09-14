'use client'

import { useEffect, useState } from 'react'
import { Phone, X, MessageCircle } from 'lucide-react'

/**
 * FloatingAdminButton — floating button "Hubungi Admin" yang fixed di
 * pojok kanan bawah. Selalu visible saat scroll. Klik untuk expand panel
 * berisi 3 opsi kontak: WhatsApp, Telepon, Email.
 *
 * Sesuai brief user revisi:
 *  - CTA WhatsApp per card di section Paket Layanan dihapus.
 *  - Diganti dengan 1 floating button ini (1 admin, model float).
 *  - Warna brand (#c48e55) sesuai hero gambar.
 *
 * Behavior:
 *  - Button collapse: lingkaran brand gradient + icon Phone + label
 *    "Hubungi Admin" (hidden di mobile, show di sm+).
 *  - Button expand: panel kecil di atas button dengan 3 opsi kontak.
 *  - Auto-collapse saat klik luar panel atau saat navigate.
 *  - Muncul setelah scroll > 100px (supaya tidak overlap dengan hero).
 */
const WA_NUMBER = '6282111222989'
const PHONE_NUMBER = '082211122989'
const EMAIL = 'innovationcaraudio@gmail.com'

export function FloatingAdminButton() {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      // Muncul setelah scroll 100px ke bawah
      setVisible(window.scrollY > 100)
      // Auto-close saat scroll (optional, biar tidak ketahan)
      if (open) setOpen(false)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    // Initial check
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close saat klik luar
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-floating-admin]')) setOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [open])

  const waLink = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
    'Halo, saya tertarik paket layanan peredam mobil. Mohon info lengkap.',
  )}`

  return (
    <div
      data-floating-admin
      className={`fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      {/* Expand panel — 3 opsi kontak */}
      {open && (
        <div className="w-64 rounded-xl border border-border bg-card p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Hubungi Admin</span>
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
            {/* WhatsApp */}
            <li>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-lg border border-border bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
              >
                <MessageCircle className="size-4 shrink-0" />
                <span className="flex-1">WhatsApp</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400">0822-1122-2989</span>
              </a>
            </li>
            {/* Telepon */}
            <li>
              <a
                href={`tel:${PHONE_NUMBER}`}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-brand/10 px-3 py-2.5 text-sm font-medium text-brand dark:text-brand-light hover:bg-brand/20 transition-colors"
              >
                <Phone className="size-4 shrink-0" />
                <span className="flex-1">Telepon</span>
                <span className="text-xs text-brand dark:text-brand-light">0822-1122-2989</span>
              </a>
            </li>
            {/* Email */}
            <li>
              <a
                href={`mailto:${EMAIL}`}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <span
                  className="grid size-4 shrink-0 place-items-center text-xs font-bold text-foreground"
                  aria-hidden
                >
                  @
                </span>
                <span className="flex-1">Email</span>
                <span className="truncate text-xs text-muted-foreground">{EMAIL.split('@')[0]}</span>
              </a>
            </li>
          </ul>
        </div>
      )}

      {/* Main button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-brand to-brand-dark px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition-all hover:shadow-xl hover:shadow-brand/40 hover:scale-105 active:scale-95"
        aria-label="Hubungi Admin"
        aria-expanded={open}
      >
        <Phone className="size-5 shrink-0" />
        <span className="hidden sm:inline">Hubungi Admin</span>
      </button>
    </div>
  )
}
