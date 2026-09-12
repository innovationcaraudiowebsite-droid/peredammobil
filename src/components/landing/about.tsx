'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Check, Award, Users, Star, ShieldCheck } from 'lucide-react'
import { Counter } from '@/components/landing/counter'
import { landingImages } from '@/lib/landing-images'

/**
 * About section — section id="about".
 * Full background image (AI workshop interior) + dramatic dark overlay.
 * Konsisten dengan hero section (sama style: full bg + overlay + text putih).
 *
 * Tidak ada duplicate "Tentang Kami" — hanya badge, headline = brand name.
 */
const STATS = [
  { icon: Award, value: 10, suffix: '+', label: 'Tahun', decimals: 0, useComma: false },
  { icon: Users, value: 1000, suffix: '+', label: 'Mobil', decimals: 0, useComma: true },
  { icon: Star, value: 4.9, suffix: '★', label: 'Rating', decimals: 1, useComma: false },
  { icon: ShieldCheck, value: 100, suffix: '%', label: 'Garansi', decimals: 0, useComma: false },
] as const

const SPECIALTIES = [
  'Peredam pintu, lantai, atap, kap mesin',
  'Upgrade audio mobil (speaker, DSP, subwoofer)',
  'Material premium import',
  'Garansi pengerjaan resmi',
]

// Animation variants
const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
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

export function About() {
  return (
    <section
      id="about"
      className="relative min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden bg-slate-950 border-t border-border"
    >
      {/* Full background image — dramatic */}
      <Image
        src={landingImages.about}
        alt="Interior workshop Innovation Car Audio Jakarta — peralatan audio mobil profesional"
        fill
        sizes="100vw"
        className="object-cover"
      />

      {/* Dramatic dark gradient overlay */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/50"
      />
      {/* Bottom fade */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"
      />
      {/* Decorative glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-1/4 left-1/4 size-72 rounded-full bg-amber-500/10 blur-3xl"
      />

      {/* Konten */}
      <div className="relative z-10 container mx-auto max-w-7xl px-4 py-16 sm:py-20 lg:py-24">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="max-w-2xl"
        >
          {/* Headline = brand name (gradient text, dramatic) */}
          <motion.h2
            variants={item}
            className="text-4xl sm:text-5xl font-bold tracking-tight"
          >
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)]">
              Innovation Car Audio
            </span>
          </motion.h2>

          {/* Description */}
          <motion.p
            variants={item}
            className="mt-5 max-w-xl text-sm sm:text-base text-white/80 leading-relaxed"
          >
            Innovation Car Audio adalah workshop spesialis peredam mobil dan
            upgrade audio yang berlokasi di Kalideres, Jakarta Barat. Kami
            telah melayani ribuan pelanggan dengan material premium dan
            pengerjaan profesional.
          </motion.p>

          {/* 4 stat cards dengan counter (sama dengan hero) */}
          <motion.div
            variants={item}
            className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl"
          >
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1, ease: 'backOut' }}
                className="rounded-xl border border-white/15 bg-black/40 px-3 py-3 backdrop-blur-md text-center hover:border-amber-500/30 transition-colors"
              >
                <s.icon className="mx-auto size-4 text-amber-400" aria-hidden />
                <div className="mt-1.5 text-xl sm:text-2xl font-bold text-white tabular-nums">
                  <Counter
                    value={s.value}
                    duration={2}
                    decimals={s.decimals}
                    suffix={s.suffix}
                    useComma={s.useComma}
                  />
                </div>
                <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-white/70">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Spesialisasi */}
          <motion.ul
            variants={item}
            className="mt-8 grid sm:grid-cols-2 gap-2 max-w-xl"
          >
            {SPECIALTIES.map((spec) => (
              <li
                key={spec}
                className="flex items-start gap-2 text-sm text-white/85"
              >
                <Check
                  className="mt-0.5 size-4 shrink-0 text-amber-400"
                  aria-hidden
                />
                <span>{spec}</span>
              </li>
            ))}
          </motion.ul>
        </motion.div>
      </div>
    </section>
  )
}
