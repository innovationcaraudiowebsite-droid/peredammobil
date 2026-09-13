import Link from 'next/link'
import { MessageCircle, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Paket Layanan section — section id="paket".
 * Sesuai permintaan user: 4 kotak paket layanan relevan untuk workshop peredam mobil.
 * Bukan list produk material, tapi paket jasa pengerjaan berdasarkan area & kebutuhan.
 */

const WA_NUMBER = '6282111222989'

type Pkg = {
  name: string
  tagline: string
  desc: string
  features: string[]
  popular?: boolean
}

const PACKAGES: Pkg[] = [
  {
    name: 'Paket 4 Pintu',
    tagline: 'Hemat & paling diminta',
    desc: 'Peredam 4 pintu dengan butyl 2mm + foam absorber. Audio speaker jernih, suara jalan berkurang.',
    features: [
      'Butyl 2mm di 4 pintu',
      'Foam absorber di door trim',
      'Pengerjaan 2–3 jam',
      'Garansi 1 tahun',
    ],
    popular: true,
  },
  {
    name: 'Paket Full Kabin',
    tagline: 'Komplit & senyap maksimal',
    desc: 'Peredam lantai + 4 pintu + plafon. Redam derau jalan, mesin, dan getaran body secara menyeluruh.',
    features: [
      'Lantai: butyl 2mm + MLV barrier',
      '4 pintu: butyl 2mm + foam',
      'Plafon: foam absorber tebal',
      'Pengerjaan 6–8 jam',
    ],
  },
  {
    name: 'Paket Kap Mesin',
    tagline: 'Redam panas & suara mesin',
    desc: 'Peredam kap mesin + firewall dengan heat barrier + butyl. Kurangi panas & derau mesin masuk kabin.',
    features: [
      'Butyl 3mm di kap mesin',
      'Heat barrier alumunium foil',
      'Firewall: MLV + foam',
      'Tahan panas sampai 120°C',
    ],
  },
  {
    name: 'Paket Wheel Housing',
    tagline: 'Anti derau ban & suspensi',
    desc: 'Peredam wheel housing (4 fender) dengan butyl tebal + foam. Redam suara ban & suspensi di jalan rusak.',
    features: [
      'Butyl 3.5mm di 4 fender',
      'Foam absorber tebal',
      'Anti air & tahan lembab',
      'Pengerjaan 3–4 jam',
    ],
  },
]

function waLinkFor(name: string): string {
  const text = `Halo, saya tertarik ${name}. Mohon info harga & detail.`
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`
}

export function Packages() {
  return (
    <section id="paket" className="border-t border-border bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:py-16 lg:py-20">
        {/* Section header */}
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Paket Layanan
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Pilih paket pengerjaan sesuai kebutuhan & budget mobil Anda.
          </p>
        </div>

        {/* 4 kotak — grid 2×2 (mobile: 1 kolom, lg: 4 kolom) */}
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PACKAGES.map((p) => (
            <li
              key={p.name}
              className={`relative flex flex-col rounded-xl border bg-card p-4 sm:p-5 transition-all duration-200 hover:shadow-lg ${
                p.popular
                  ? 'border-amber-500 shadow-md'
                  : 'border-border hover:border-amber-500/40'
              }`}
            >
              {/* Badge popular */}
              {p.popular && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                  Populer
                </span>
              )}

              {/* Tagline */}
              <span className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                {p.tagline}
              </span>

              {/* Title */}
              <h3 className="mt-1 text-lg sm:text-xl font-bold leading-tight">
                {p.name}
              </h3>

              {/* Description */}
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {p.desc}
              </p>

              {/* Features */}
              <ul className="mt-4 space-y-1.5 flex-1">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-xs sm:text-sm text-foreground/90"
                  >
                    <Check
                      className="mt-0.5 size-3.5 shrink-0 text-amber-500"
                      aria-hidden
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                asChild
                size="sm"
                className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white"
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
            </li>
          ))}
        </ul>

        {/* Note */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          * Harga bisa berubah, hubungi admin untuk harga terbaru & estimasi
          khusus mobil Anda.
        </p>

        {/* CTA secondary */}
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
