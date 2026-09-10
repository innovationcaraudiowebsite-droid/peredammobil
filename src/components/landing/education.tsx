import Link from 'next/link'
import { Lightbulb, Search, Coins, ArrowRight, Check } from 'lucide-react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'

/**
 * Edukasi section landing — section id="edukasi".
 * 3 card grid (responsive: 3 kolom desktop, 2 tablet, 1 mobile).
 *
 * Server component — static content.
 */
type EduCard = {
  icon: typeof Lightbulb
  title: string
  bullets: string[]
  href: string
}

const CARDS: EduCard[] = [
  {
    icon: Lightbulb,
    title: 'Kenapa Peredam?',
    bullets: [
      'Kurangi kebisingan kabin',
      'Audio lebih jernih',
      'Kabin senyap & nyaman',
      'Nilai jual mobil naik',
    ],
    href: '/berita/peredam-mobil',
  },
  {
    icon: Search,
    title: 'Cara Memilih Peredam',
    bullets: [
      'Material butyl vs aspal',
      'Ketebalan material',
      'Brand terpercaya',
      'Sesuai budget',
    ],
    href: '/berita/peredam-mobil/beda-damper-absorber-dan-barrier-yang-sering-tertukar',
  },
  {
    icon: Coins,
    title: 'Tips & Biaya',
    bullets: [
      'Paket 4 pintu hemat',
      'Paket full body',
      'Estimasi biaya per area',
      'Tips hemat tanpa kompromi',
    ],
    href: '/berita/tips-biaya',
  },
]

export function Education() {
  return (
    <section id="edukasi" className="border-t border-border bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:py-16 lg:py-20">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            <span className="size-1.5 rounded-full bg-amber-500" />
            Edukasi
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
            Edukasi Peredam Mobil
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Pelajari dasar-dasar peredam sebelum pasang.
          </p>
        </div>

        {/* 3 card grid */}
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c) => (
            <Card
              key={c.title}
              className="gap-4 p-6 transition-all duration-200 hover:shadow-md hover:border-amber-500/40"
            >
              <CardContent className="px-0">
                {/* Icon badge */}
                <div className="inline-grid place-items-center size-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm">
                  <c.icon className="size-6" aria-hidden />
                </div>

                <h3 className="mt-4 text-xl font-semibold">{c.title}</h3>

                <ul className="mt-3 space-y-2">
                  {c.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-emerald-500"
                        aria-hidden
                      />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={c.href}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-400 hover:gap-2.5 transition-all"
                >
                  Pelajari
                  <ArrowRight className="size-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
