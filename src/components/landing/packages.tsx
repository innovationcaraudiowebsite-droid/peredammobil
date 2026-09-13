import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Check, Star, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Paket Layanan section — section id="paket".
 *
 * Layout konsisten dengan section 5 (Artikel Terbaru) & section 3 (Jenis Bahan):
 * horizontal card — gambar kiri 140×94 + konten kanan (badge + nama + desc + features).
 *
 * Sesuai brief user revisi:
 *  - CTA WhatsApp per card DIHAPUS. Diganti dengan 1 floating button
 *    "Hubungi Admin" yang fixed di pojok kanan bawah (selalu visible saat scroll).
 *  - Warna accent diubah dari amber-500 (orange) ke brand color (#c48e55 caramel,
 *    sesuai warna golden-brown di hero gambar).
 *
 * 4 paket jasa relevan: 4 Pintu (populer), Full Kabin, Kap Mesin, Wheel Housing.
 */

type Pkg = {
  name: string
  tagline: string
  desc: string
  features: string[]
  image: string
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
    image: '/landing-img/paket-4-pintu.png',
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
    image: '/landing-img/paket-full-kabin.png',
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
    image: '/landing-img/paket-kap-mesin.png',
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
    image: '/landing-img/paket-wheel-housing.png',
  },
]

export function Packages() {
  return (
    <section id="paket" className="border-t border-border bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:py-16 lg:py-20">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Paket Layanan
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Pilih paket pengerjaan sesuai kebutuhan &amp; budget mobil Anda.
            </p>
          </div>
          <Link
            href="/berita"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand dark:text-brand-light hover:gap-2.5 transition-all"
          >
            Lihat Panduan Lengkap
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Vertical list — horizontal cards (gambar kiri 140×94 + konten kanan) */}
        <ul className="mt-8 space-y-4">
          {PACKAGES.map((p) => (
            <li
              key={p.name}
              className={`rounded-xl border bg-card p-3 sm:p-4 min-h-[160px] transition-all duration-200 hover:shadow-md ${
                p.popular
                  ? 'border-brand shadow-sm'
                  : 'border-border hover:border-brand/40'
              }`}
            >
              <div className="flex gap-3 sm:gap-4 items-start">
                {/* Gambar kecil kiri — aspect-square (1:1) supaya rasio konsisten */}
                <div className="shrink-0 relative overflow-hidden rounded-md bg-muted border border-border w-[100px] sm:w-[120px] aspect-square">
                  <Image
                    src={p.image}
                    alt={`Paket layanan ${p.name} — workshop Peredam Mobil Jakarta`}
                    fill
                    sizes="(min-width: 640px) 120px, 100px"
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                  {/* Badge popular di pojok gambar */}
                  {p.popular && (
                    <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                      <Star className="size-2.5 fill-current" />
                      Populer
                    </span>
                  )}
                </div>

                {/* Konten kanan */}
                <div className="min-w-0 flex-1 pt-0.5">
                  {/* Meta: tagline */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-block rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand dark:text-brand-light">
                      {p.tagline}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mt-1.5 text-lg sm:text-xl font-bold leading-snug">
                    {p.name}
                  </h3>

                  {/* Deskripsi */}
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {p.desc}
                  </p>

                  {/* Features checklist */}
                  <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 sm:max-w-md">
                    {p.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-1.5 text-xs text-foreground/90"
                      >
                        <Check
                          className="mt-0.5 size-3.5 shrink-0 text-brand"
                          aria-hidden
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Note */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          * Harga hubungi admin untuk estimasi khusus mobil Anda. Klik tombol
          <span className="mx-1 inline-flex items-center gap-0.5 font-semibold text-brand dark:text-brand-light">
            <Phone className="size-3" />
            Hubungi Admin
          </span>
          di pojok kanan bawah.
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
