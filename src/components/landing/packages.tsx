import Link from 'next/link'
import { Package, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'

/**
 * Paket section landing — section id="paket".
 * Grid 4 kolom (desktop), 2 (tablet), 1 (mobile).
 * 7 produk card (data hard-coded).
 *
 * Server component — static content.
 */
const WA_NUMBER = '6282111222989'

type Pkg = {
  name: string
  desc: string
}

const PACKAGES: Pkg[] = [
  {
    name: 'Gran Turismo 1.8mm',
    desc: 'Peredam butyl premium 1.8mm, fleksibel & tahan panas. Cocok untuk pintu dan panel kabin. Hasil damping maksimal.',
  },
  {
    name: 'Gran Turismo 2mm',
    desc: 'Peredam butyl 2mm dengan lapisan aluminium tebal. Redam getaran pelat, kurangi derau jalan. Pilihan banyak workshop.',
  },
  {
    name: 'Infinity',
    desc: 'Material peredam Infinity, kualitas premium dengan harga kompetitif. Tahan lama & tidak meleleh di suhu Jakarta.',
  },
  {
    name: 'Rainbow 2mm',
    desc: 'Peredam Rainbow 2mm, butyl rubber berkualitas. Pilihan ekonomis untuk daily car. Hasil damping yang solid.',
  },
  {
    name: 'Rainbow 3.5mm',
    desc: 'Peredam Rainbow 3.5mm, ketebalan optimal untuk lantai & wheel housing. Redam derau ban & jalan.',
  },
  {
    name: 'Rainbow 4mm',
    desc: 'Peredam Rainbow 4mm, premium thickness. Maksimal damping untuk kabin senyap. Cocok untuk audiophile.',
  },
  {
    name: 'Silent Coat 2mm',
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
        <div className="mx-auto max-w-2xl text-center">
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

        {/* 7 cards grid (4 cols desktop, 2 tablet, 1 mobile) */}
        <div className="mt-10 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PACKAGES.map((p) => (
            <Card
              key={p.name}
              className="gap-3 p-4 sm:p-5 transition-all duration-200 hover:shadow-md hover:border-amber-500/40"
            >
              <CardContent className="px-0">
                {/* Thumbnail — CSS gradient + Package icon */}
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gradient-to-br from-amber-500 via-orange-500 to-orange-700 shadow-inner">
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                    }}
                  />
                  <div className="absolute inset-0 grid place-items-center">
                    <Package
                      className="size-12 text-white/90"
                      strokeWidth={1.4}
                      aria-hidden
                    />
                  </div>
                  <span className="absolute bottom-1.5 right-1.5 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/90 backdrop-blur">
                    Premium
                  </span>
                </div>

                {/* Nama produk */}
                <h3 className="mt-3 text-base font-semibold leading-snug">
                  {p.name}
                </h3>

                {/* Deskripsi */}
                <p className="mt-1.5 text-sm text-muted-foreground line-clamp-3">
                  {p.desc}
                </p>

                {/* Harga */}
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Harga
                  </span>
                  <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                    Hubungi admin
                  </span>
                </div>

                {/* Tombol Pesan via WA */}
                <Button
                  asChild
                  size="sm"
                  className="mt-3 w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  <a
                    href={waLinkFor(p.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="size-4" />
                    Pesan via WA
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Note di bawah grid */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          * Harga bisa berubah, hubungi admin untuk harga terbaru.
        </p>

        {/* CTA secondary — lihat semua artikel (link ke /berita) */}
        <div className="mt-8 text-center">
          <Button asChild variant="outline" size="sm">
            <Link href="/berita">Pelajari Panduan Lengkap di Portal Berita</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
