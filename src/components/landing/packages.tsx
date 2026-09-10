import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { paketImageUrl } from '@/lib/landing-images'

/**
 * Paket section landing — section id="paket".
 * 2-column grid dengan horizontal cards (gambar kiri 120×80 + konten kanan).
 * Konsisten dengan LatestArticles & Education section.
 *
 * Server component — static content.
 */
const WA_NUMBER = '6282111222989'

type Pkg = {
  name: string
  slug: string
  desc: string
}

const PACKAGES: Pkg[] = [
  {
    name: 'Gran Turismo 1.8mm',
    slug: 'gran-turismo-1-8mm',
    desc: 'Peredam butyl premium 1.8mm, fleksibel & tahan panas. Cocok untuk pintu dan panel kabin. Hasil damping maksimal.',
  },
  {
    name: 'Gran Turismo 2mm',
    slug: 'gran-turismo-2mm',
    desc: 'Peredam butyl 2mm dengan lapisan aluminium tebal. Redam getaran pelat, kurangi derau jalan. Pilihan banyak workshop.',
  },
  {
    name: 'Infinity',
    slug: 'infinity',
    desc: 'Material peredam Infinity, kualitas premium dengan harga kompetitif. Tahan lama & tidak meleleh di suhu Jakarta.',
  },
  {
    name: 'Rainbow 2mm',
    slug: 'rainbow-2mm',
    desc: 'Peredam Rainbow 2mm, butyl rubber berkualitas. Pilihan ekonomis untuk daily car. Hasil damping yang solid.',
  },
  {
    name: 'Rainbow 3.5mm',
    slug: 'rainbow-3-5mm',
    desc: 'Peredam Rainbow 3.5mm, ketebalan optimal untuk lantai & wheel housing. Redam derau ban & jalan.',
  },
  {
    name: 'Rainbow 4mm',
    slug: 'rainbow-4mm',
    desc: 'Peredam Rainbow 4mm, premium thickness. Maksimal damping untuk kabin senyap. Cocok untuk audiophile.',
  },
  {
    name: 'Silent Coat 2mm',
    slug: 'silent-coat-2mm',
    desc: 'Silent Coat 2mm, material import Eropa. Kualitas terbaik untuk kabin premium. Tahan panas & lembab.',
  },
]

function waLinkFor(name: string): string {
  const text = `Halo, saya tertarik paket ${name}. Mohon info lengkap.`
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`
}

export function Packages() {
  return (
    <section id="paket" className="border-t border-border bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:py-16 lg:py-20">
        {/* Section header */}
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            <span className="size-1.5 rounded-full bg-amber-500" />
            Paket Produk
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
            Paket Produk Jasa Layanan
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Pilih material peredam premium untuk mobil Anda.
          </p>
        </div>

        {/* 2-col grid horizontal cards */}
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {PACKAGES.map((p) => (
            <li
              key={p.name}
              className="rounded-xl border border-border bg-card p-3 sm:p-4 transition-all duration-200 hover:shadow-md hover:border-amber-500/40"
            >
              <div className="flex gap-3 sm:gap-4 items-start">
                {/* Gambar kecil kiri 120×80 */}
                <div className="shrink-0 relative overflow-hidden rounded-md bg-muted border border-border w-[120px] h-[80px] sm:w-[140px] sm:h-[94px]">
                  <Image
                    src={paketImageUrl(p.slug)}
                    alt={`Paket peredam mobil ${p.name} Innovation Car Audio Jakarta`}
                    fill
                    sizes="(min-width: 640px) 140px, 120px"
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>

                {/* Konten kanan */}
                <div className="min-w-0 flex-1">
                  {/* Meta: badge Premium */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-block rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Premium
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mt-1.5 font-semibold leading-snug">
                    {p.name}
                  </h3>

                  {/* Deskripsi */}
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {p.desc}
                  </p>

                  {/* Harga + Tombol Pesan */}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Harga:
                      </span>
                      <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                        Hubungi admin
                      </span>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      <a
                        href={waLinkFor(p.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="size-3.5" />
                        Pesan via WA
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Note di bawah grid */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          * Harga bisa berubah, hubungi admin untuk harga terbaru.
        </p>

        {/* CTA secondary — lihat semua artikel (link ke /berita) */}
        <div className="mt-6 text-center">
          <Button asChild variant="outline" size="sm">
            <Link href="/berita">
              Pelajari Panduan Lengkap di Portal Berita
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
