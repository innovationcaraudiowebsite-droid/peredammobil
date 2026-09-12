'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle, ArrowRight, ShieldCheck, Star, Users, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Counter } from '@/components/landing/counter'
import { landingImages } from '@/lib/landing-images'

/**
 * Hero section — section id="hero".
 * Full background image (AI workshop Jakarta) + dark overlay + teks putih.
 * Counter animation untuk 4 stat cards di bawah.
 *
 * Client component karena pakai framer-motion (via Counter) untuk animasi.
 */
const WA_NUMBER = '6282111222989'
const WA_LINK = `https://wa.me/${WA_NUMBER}`

const TRUST_BADGES = [
  { icon: Award, value: 10, suffix: '+', label: 'TAHUN', decimals: 0 },
  { icon: Users, value: 1000, suffix: '+', label: 'MOBIL', decimals: 0, useComma: true },
  { icon: Star, value: 4.9, suffix: '★', label: 'RATING', decimals: 1 },
  { icon: ShieldCheck, value: 100, suffix: '%', label: 'GARANSI', decimals: 0 },
] as const

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden bg-slate-950"
    >
      {/* Full background image */}
      <Image
        src={landingImages.heroBg}
        alt="Workshop Innovation Car Audio Jakarta — pemasangan peredam mobil profesional"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      {/* Dark gradient overlay untuk kontras teks putih */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/40"
      />
      {/* Bottom gradient untuk fade ke section berikutnya */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"
      />

      {/* Konten */}
      <div className="relative z-10 container mx-auto max-w-7xl px-4 py-16 sm:py-20 lg:py-24">
        <div className="max-w-2xl text-white">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-300 backdrop-blur">
            <span className="size-1.5 rounded-full bg-amber-400" />
            Workshop Peredam &amp; Audio Mobil
          </span>

          {/* Headline */}
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight drop-shadow-lg">
            Innovation Car Audio
          </h1>

          {/* Subtitle */}
          <p className="mt-3 text-xl sm:text-2xl font-semibold text-amber-400 drop-shadow">
            Spesialis Peredam &amp; Audio Mobil Jakarta
          </p>

          {/* Description */}
          <p className="mt-5 max-w-xl text-sm sm:text-base text-white/85 leading-relaxed">
            Material premium, hasil maksimal, garansi terpercaya. Workshop
            terpercaya di Kalideres, Jakarta Barat sejak 2015.
          </p>

          {/* CTA buttons */}
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Button
              asChild
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
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
              className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur"
            >
              <Link href="#paket">
                Lihat Paket
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Counter stats — 4 cards di bawah */}
        <div className="mt-12 lg:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl">
          {TRUST_BADGES.map((b) => (
            <div
              key={b.label}
              className="rounded-xl border border-white/15 bg-black/40 px-4 py-4 backdrop-blur-md text-center"
            >
              <b.icon className="mx-auto size-5 text-amber-400" aria-hidden />
              <div className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold text-white tabular-nums">
                <Counter
                  value={b.value}
                  duration={2}
                  decimals={b.decimals}
                  suffix={b.suffix}
                  useComma={'useComma' in b ? (b as { useComma: boolean }).useComma : false}
                />
              </div>
              <div className="mt-1 text-xs font-medium uppercase tracking-wider text-white/70">
                {b.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
