import { Wrench, Check, Award, Users, Star, ShieldCheck } from 'lucide-react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'

/**
 * About section landing — section id="about".
 * 2 kolom desktop (kiri gambar placeholder, kanan teks).
 * Mobile: stack vertical.
 *
 * Server component — static content.
 */
const STATS = [
  { icon: Award, value: '10+ Tahun', label: 'Pengalaman' },
  { icon: Users, value: '1000+', label: 'Mobil Dilayani' },
  { icon: Star, value: '4.9★', label: 'Rating Google' },
  { icon: ShieldCheck, value: '100%', label: 'Garansi Resmi' },
]

const SPECIALTIES = [
  'Peredam pintu/lantai/atap/kap mesin',
  'Upgrade audio mobil (speaker, DSP, subwoofer)',
  'Material premium (butyl, aluminium, EVA)',
  'Garansi pengerjaan & hasil damping',
]

export function About() {
  return (
    <section id="about" className="border-t border-border bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:py-16 lg:py-20">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Kiri — Gambar (placeholder CSS gradient + icon Wrench) */}
          <div className="order-1">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full rounded-2xl border border-border bg-gradient-to-br from-slate-900 via-amber-900/40 to-orange-700/50 shadow-lg overflow-hidden">
              {/* Diagonal stripes overlay */}
              <div
                aria-hidden
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, rgba(255,255,255,.18) 0 2px, transparent 2px 12px)',
                }}
              />
              <div className="absolute inset-0 grid place-items-center">
                <div className="flex flex-col items-center gap-3 text-white/90">
                  <Wrench className="size-20 sm:size-28 lg:size-36" strokeWidth={1.4} />
                  <span className="text-xs sm:text-sm font-medium uppercase tracking-[0.25em] text-amber-200">
                    Pengerjaan Profesional
                  </span>
                </div>
              </div>
              <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-black/50 px-3 py-2 text-xs text-white/90 backdrop-blur">
                Workshop Kalideres · Sejak 2015
              </div>
            </div>
          </div>

          {/* Kanan — Teks + stats + spesialisasi */}
          <div className="order-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
              <span className="size-1.5 rounded-full bg-amber-500" />
              Tentang Kami
            </span>

            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
              Tentang Kami
            </h2>

            <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Innovation Car Audio adalah workshop spesialis peredam mobil dan
              upgrade audio yang berlokasi di Kalideres, Jakarta Barat. Kami
              telah melayani ribuan pelanggan dengan material premium dan
              pengerjaan profesional.
            </p>

            {/* 4 stat cards */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STATS.map((s) => (
                <Card key={s.label} className="gap-2 p-3 sm:p-4 text-center">
                  <CardContent className="px-0">
                    <s.icon className="mx-auto size-5 text-amber-500" aria-hidden />
                    <div className="mt-1.5 text-lg font-bold leading-none">
                      {s.value}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {s.label}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Spesialisasi list */}
            <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 sm:p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                Spesialisasi
              </h3>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {SPECIALTIES.map((s) => (
                  <li
                    key={s}
                    className="flex items-start gap-2 text-sm text-foreground/90"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
