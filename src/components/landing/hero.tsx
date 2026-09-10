import Link from 'next/link'
import { Car, MessageCircle, ArrowRight, ShieldCheck, Star, Users, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Hero section landing page — section id="hero".
 * Background gradient amber → orange → slate-900.
 * 2 kolom desktop (kiri gambar placeholder, kanan teks). Mobile stack vertical.
 *
 * Server component — static content (no DB query).
 */
const WA_NUMBER = '6282111222989'
const WA_LINK = `https://wa.me/${WA_NUMBER}`

const TRUST_BADGES = [
  { icon: Award, label: '10+ Tahun' },
  { icon: Users, label: '1000+ Mobil' },
  { icon: Star, label: '4.9★ Rating' },
  { icon: ShieldCheck, label: '100% Garansi' },
]

export function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-600 to-slate-900"
    >
      {/* Decorative glow blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-amber-300/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 -left-24 size-72 rounded-full bg-orange-700/40 blur-3xl"
      />

      <div className="container mx-auto max-w-7xl px-4 py-12 sm:py-16 lg:py-20">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Kiri — Gambar ilustrasi (placeholder CSS gradient + icon Car) */}
          <div className="order-1 lg:order-1">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[5/4] w-full rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900/60 via-orange-900/40 to-amber-900/40 shadow-2xl overflow-hidden">
              {/* Grid pattern overlay */}
              <div
                aria-hidden
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)',
                  backgroundSize: '32px 32px',
                }}
              />
              {/* Big Car icon center */}
              <div className="absolute inset-0 grid place-items-center">
                <div className="flex flex-col items-center gap-3 text-white/90">
                  <Car className="size-24 sm:size-32 lg:size-40" strokeWidth={1.2} />
                  <span className="text-xs sm:text-sm font-medium uppercase tracking-[0.3em] text-amber-200">
                    Innovation Car Audio
                  </span>
                </div>
              </div>
              {/* Bottom badge */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 rounded-lg bg-black/40 px-3 py-2 text-xs text-white/90 backdrop-blur">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-amber-300" />
                  Workshop Kalideres, Jakarta Barat
                </span>
                <span className="hidden sm:inline text-amber-200">sejak 2015</span>
              </div>
            </div>
          </div>

          {/* Kanan — Teks */}
          <div className="order-2 text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur">
              <span className="size-1.5 rounded-full bg-amber-300" />
              Workshop Peredam & Audio Mobil
            </span>

            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              Innovation Car Audio
            </h1>

            <p className="mt-2 text-xl sm:text-2xl font-semibold text-amber-400">
              Spesialis Peredam &amp; Audio Mobil Jakarta
            </p>

            <p className="mt-4 max-w-xl text-sm sm:text-base text-white/80 leading-relaxed">
              Material premium, hasil maksimal, garansi terpercaya. Workshop
              terpercaya di Kalideres, Jakarta Barat sejak 2015.
            </p>

            {/* CTA buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-5" />
                  Chat WhatsApp
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <Link href="#paket">
                  Lihat Paket
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TRUST_BADGES.map((b) => (
                <div
                  key={b.label}
                  className="rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur"
                >
                  <b.icon className="size-4 text-amber-300" aria-hidden />
                  <span className="mt-1 block text-sm font-semibold text-white">
                    {b.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
