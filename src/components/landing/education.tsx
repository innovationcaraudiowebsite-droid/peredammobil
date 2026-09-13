import Image from 'next/image'

/**
 * Jenis Bahan Peredam & Fungsinya section — section id="edukasi".
 *
 * Layout konsisten dengan section 5 (Artikel Terbaru) — horizontal card:
 * gambar kiri 140×94 + konten kanan (badge nomor + nama + deskripsi + CTA).
 *
 * 4 jenis material utama: Butyl, Absorber, Spant, Nex.
 */

type BahanItem = {
  no: string
  name: string
  fungsi: string
  image: string
}

const BAHAN_LIST: BahanItem[] = [
  {
    no: '01',
    name: 'Butyl',
    fungsi: 'Peredam getaran utama untuk pelat logam (pintu, lantai, kap mesin). Butyl rubber 2–4mm menyerap getaran mesin & jalan.',
    image: '/landing-img/bahan-butyl.png',
  },
  {
    no: '02',
    name: 'Absorber',
    fungsi: 'Material busa/foam berdaya serap tinggi untuk suara udara. Dipasang di atas butyl, cocok untuk plafon & door trim.',
    image: '/landing-img/bahan-absorber.png',
  },
  {
    no: '03',
    name: 'Spant',
    fungsi: 'Lapisan barrier MLV yang menahan suara lolos ke kabin. Berat 1–4 kg/m², efektif untuk frekuensi mesin diesel.',
    image: '/landing-img/bahan-spant.png',
  },
  {
    no: '04',
    name: 'Nex',
    fungsi: 'Komposit all-in-one (foam + barrier + foil). Praktis untuk area sempit, dipasang di pintu atau plafon.',
    image: '/landing-img/bahan-nex.png',
  },
]

export function Education() {
  return (
    <section id="edukasi" className="border-t border-border bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:py-16 lg:py-20">
        {/* Section header */}
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Jenis Bahan Peredam &amp; Fungsinya
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Kenali 4 jenis material utama yang dipakai workshop profesional.
          </p>
        </div>

        {/* Vertical list — horizontal cards (gambar kiri 140×94 + konten kanan) */}
        <ul className="mt-8 space-y-4">
          {BAHAN_LIST.map((b) => (
            <li
              key={b.no}
              className="rounded-xl border border-border bg-card p-3 sm:p-4 min-h-[160px] transition-all duration-200 hover:shadow-md hover:border-brand/40"
            >
              <div className="flex gap-3 sm:gap-4 items-start">
                {/* Gambar kecil kiri — aspect-square (1:1) supaya rasio konsisten */}
                <div className="shrink-0 relative overflow-hidden rounded-md bg-muted border border-border w-[100px] sm:w-[120px] aspect-square">
                  <Image
                    src={b.image}
                    alt={`Bahan peredam ${b.name} untuk mobil`}
                    fill
                    sizes="(min-width: 640px) 120px, 100px"
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>

                {/* Konten kanan */}
                <div className="min-w-0 flex-1 pt-0.5">
                  {/* Meta: badge nomor + label */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-block rounded bg-brand px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                      {b.no}
                    </span>
                    <span className="inline-block text-[10px] font-semibold uppercase tracking-wide text-brand dark:text-brand-light">
                      Jenis Bahan
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mt-2 text-lg sm:text-xl font-bold leading-snug">
                    {b.name}
                  </h3>

                  {/* Deskripsi fungsi */}
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    {b.fungsi}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
