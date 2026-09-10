import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Check } from 'lucide-react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { eduImageUrl } from '@/lib/landing-images'

/**
 * Edukasi section landing — section id="edukasi".
 * 3 card grid (responsive: 3 kolom desktop, 2 tablet, 1 mobile).
 * Setiap card punya gambar AI di atas + konten di bawah.
 *
 * Server component — static content.
 */
type EduCard = {
  slug: string
  title: string
  bullets: string[]
  href: string
}

const CARDS: EduCard[] = [
  {
    slug: 'kenapa-peredam',
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
    slug: 'cara-memilih',
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
    slug: 'tips-biaya',
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

        {/* 3 card grid dengan AI image */}
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c) => (
            <Card
              key={c.title}
              className="overflow-hidden p-0 transition-all duration-200 hover:shadow-lg hover:border-amber-500/40"
            >
              <CardContent className="px-0">
                {/* AI Image di atas — full width, 16:9 */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                  <Image
                    src={eduImageUrl(c.slug)}
                    alt={`Edukasi: ${c.title}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>

                {/* Konten di bawah */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold">{c.title}</h3>

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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
