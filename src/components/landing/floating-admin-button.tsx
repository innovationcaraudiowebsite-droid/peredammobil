'use client'

import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'

/**
 * FloatingAdminButton — floating button WA Sales yang fixed di pojok
 * kanan bawah. Selalu visible saat scroll. Klik → langsung buka WhatsApp
 * ke nomor WA Sales (no panel expand, no telp/email).
 *
 * Sesuai brief user revisi:
 *  - Ganti icon Phone (warna coklat brand) → logo WhatsApp (warna hijau
 *    emerald, khas WhatsApp).
 *  - Ganti nomor WA lama (0822-1122-2989) → WA Sales: 62 812-9595-2279.
 *  - Sederhanakan: hapus panel expand 3 opsi (WA/Telp/Email). Sekarang
 *    hanya 1 action — langsung buka wa.me/<nomor>.
 *
 * Behavior:
 *  - Muncul setelah scroll > 100px (supaya tidak overlap dengan hero).
 *  - Klik → window.open(waLink, '_blank') → langsung chat WA Sales.
 *  - Warna: emerald gradient (hijau khas WhatsApp).
 *  - Icon: MessageCircle (logo WA dari lucide-react).
 */
const WA_SALES = '6281295952279' // 62 812-9595-2279 (WA Sales)

export function FloatingAdminButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      // Muncul setelah scroll 100px ke bawah
      setVisible(window.scrollY > 100)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    // Initial check
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const waLink = `https://wa.me/${WA_SALES}?text=${encodeURIComponent(
    'Halo, saya tertarik paket layanan peredam mobil. Mohon info lengkap.',
  )}`

  return (
    <a
      href={waLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat WhatsApp Sales"
      className={`fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <MessageCircle className="size-5 shrink-0" />
      <span className="hidden sm:inline">Chat WA Sales</span>
    </a>
  )
}
