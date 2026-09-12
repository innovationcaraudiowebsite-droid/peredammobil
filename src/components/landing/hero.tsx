'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { MessageCircle, ArrowRight, ShieldCheck, Star, Users, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Counter } from '@/components/landing/counter'
import { landingImages } from '@/lib/landing-images'

/**
 * Hero section — section id="hero".
 * Full background image (AI cinematic workshop Jakarta) + dark overlay.
 * Dramatic fade-in + slide-up animations via framer-motion.
 * Counter animation untuk 4 stat cards.
 */
const WA_NUMBER = '6282111222989'
const WA_LINK = `https://wa.me/${WA_NUMBER}`

const TRUST_BADGES = [
  { icon: Award, value: 10, suffix: '+', label: 'TAHUN', decimals: 0, useComma: false },
  { icon: Users, value: 1000, suffix: '+', label: 'MOBIL', decimals: 0, useComma: true },
  { icon: Star, value: 4.9, suffix: '★', label: 'RATING', decimals: 1, useComma: false },
  { icon: ShieldCheck, value: 100, suffix: '%', label: 'GARANSI', decimals: 0, useComma: false },
] as const

// Animation variants
const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
}

const item = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
  },
}

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

      {/* Dramatic dark gradient overlay */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40"
      />
      {/* Bottom fade */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"
      />
      {/* Decorative glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/4 right-1/4 size-64 rounded-full bg-amber-500/10 blur-3xl"
      />

      {/* Konten */}
      <div className="relative z-10 container mx-auto max-w-7xl px-4 py-16 sm:py-20 lg:py-24">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="max-w-2xl"
        >
          {/* Headline — Innovation Car Audio (gradient text, dramatic) */}
          <motion.h1
            variants={item}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight"
          >
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)]">
              Innovation Car Audio
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={item}
            className="mt-3 text-xl sm:text-2xl font-semibold text-amber-400 drop-shadow"
          >
            Spesialis Peredam &amp; Audio Mobil Jakarta
          </motion.p>

          {/* Description */}
          <motion.p
            variants={item}
            className="mt-5 max-w-xl text-sm sm:text-base text-white/80 leading-relaxed"
          >
            Material premium, hasil maksimal, garansi terpercaya. Workshop
            terpercaya di Kalideres, Jakarta Barat sejak 2015.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={item}
            className="mt-7 flex flex-col sm:flex-row gap-3"
          >
            <Button
              asChild
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
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
          </motion.div>

          {/* Counter stats — 4 cards */}
          <motion.div
            variants={item}
            className="mt-12 lg:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl"
          >
            {TRUST_BADGES.map((b, i) => (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.2 + i * 0.15, ease: 'backOut' }}
                className="rounded-xl border border-white/15 bg-black/40 px-4 py-4 backdrop-blur-md text-center hover:border-amber-500/30 transition-colors"
              >
                <b.icon className="mx-auto size-5 text-amber-400" aria-hidden />
                <div className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold text-white tabular-nums">
                  <Counter
                    value={b.value}
                    duration={2}
                    decimals={b.decimals}
                    suffix={b.suffix}
                    useComma={b.useComma}
                  />
                </div>
                <div className="mt-1 text-xs font-medium uppercase tracking-wider text-white/70">
                  {b.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
