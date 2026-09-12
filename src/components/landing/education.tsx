import Link from 'next/link'
import Image from 'next/image'
import { Clock, ArrowRight } from 'lucide-react'
import { eduImageUrl } from '@/lib/landing-images'

/**
 * Edukasi section landing — section id="edukasi".
 * Vertical list dengan horizontal cards (gambar kiri 120×80 + konten kanan).
 * Konsisten dengan LatestArticles section.
 *
 * Server component — static content.
 */
type EduCard = {
  slug: string
  title: string
  bullets: string[]
  href: string
  readTime: string
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
    readTime: '2 mnt',
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
    readTime: '2 mnt',
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
    readTime: '2 mnt',
  },
]

/**
 * Join bullets jadi 1 paragraf dengan ". " separator.
 */
function joinBullets(bullets: string[]): string {
  return bullets.join('. ') + '.'
}

export function Education() {
  return (
    <section id="edukasi" className="border-t border-border bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:py-16 lg:py-20">
        {/* Section header */}
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Edukasi Peredam Mobil
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Pelajari dasar-dasar peredam sebelum pasang.
          </p>
        </div>

        {/* Vertical list — horizontal cards (gambar kiri + konten kanan) */}
        <ul className="mt-8 space-y-4">
          {CARDS.map((c) => (
            <li
              key={c.title}
              className="rounded-xl border border-border bg-card p-3 sm:p-4 transition-all duration-200 hover:shadow-md hover:border-amber-500/40"
            >
              <Link href={c.href} className="group flex gap-3 sm:gap-4 items-start">
                {/* Gambar kecil kiri 120×80 */}
                <div className="shrink-0 relative overflow-hidden rounded-md bg-muted border border-border w-[120px] h-[80px] sm:w-[140px] sm:h-[94px]">
                  <Image
                    src={eduImageUrl(c.slug)}
                    alt={`Edukasi: ${c.title}`}
                    fill
                    sizes="(min-width: 640px) 140px, 120px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Konten kanan */}
                <div className="min-w-0 flex-1">
                  {/* Meta: badge Edukasi + read time */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-block rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Edukasi
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" />
                      {c.readTime} baca
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mt-1.5 font-semibold leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {c.title}
                  </h3>

                  {/* Excerpt — join bullets jadi paragraf */}
                  <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                    {joinBullets(c.bullets)}
                  </p>

                  {/* CTA */}
                  <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-amber-700 dark:text-amber-400 group-hover:gap-1.5 transition-all">
                    Pelajari
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
