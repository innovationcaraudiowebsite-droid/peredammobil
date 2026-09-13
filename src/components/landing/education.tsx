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
    fungsi:
      'Peredam getaran utama yang dipasang langsung ke pelat logam (pintu, lantai, kap mesin). Butyl rubber tebal 2–4mm menyerap getaran mesin & jalan, menambah massa pelat sehingga mengurangi resonansi. Tahan panas dan tidak meleleh di suhu Jakarta.',
    image: '/landing-img/bahan-butyl.png',
  },
  {
    no: '02',
    name: 'Absorber',
    fungsi:
      'Material busa / foam berdaya serap tinggi yang menyerap suara udara di dalam kabin. Dipasang di atas lapisan butyl untuk menangkap frekuensi menengah-tinggi. Cocok untuk plafon, door trim, dan bawah kursi.',
    image: '/landing-img/bahan-absorber.png',
  },
  {
    no: '03',
    name: 'Spant',
    fungsi:
      'Lapisan barrier (biasanya Mass Loaded Vinyl / MLV) yang menahan suara lolos dari luar ke kabin. Berat 1–4 kg/m², dipasang di lantai dan firewall. Efektif untuk frekuensi rendah mesin diesel & knalpot.',
    image: '/landing-img/bahan-spant.png',
  },
  {
    no: '04',
    name: 'Nex',
    fungsi:
      'Lapisan akustik komposit (kombinasi foam + barrier + foil) all-in-one. Praktis untuk area sempit, dipasang di pintu setelah butyl, atau di plafon. Memberikan damping + absorpsi + barrier dalam satu lapisan.',
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
              className="rounded-xl border border-border bg-card p-3 sm:p-4 transition-all duration-200 hover:shadow-md hover:border-amber-500/40"
            >
              <div className="flex gap-3 sm:gap-4 items-start">
                {/* Gambar kecil kiri 120×80 / 140×94 */}
                <div className="shrink-0 relative overflow-hidden rounded-md bg-muted border border-border w-[120px] h-[80px] sm:w-[140px] sm:h-[94px]">
                  <Image
                    src={b.image}
                    alt={`Bahan peredam ${b.name} untuk mobil`}
                    fill
                    sizes="(min-width: 640px) 140px, 120px"
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>

                {/* Konten kanan */}
                <div className="min-w-0 flex-1">
                  {/* Meta: badge nomor + label */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-block rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      {b.no}
                    </span>
                    <span className="inline-block text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      Jenis Bahan
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mt-1.5 text-lg sm:text-xl font-bold leading-snug">
                    {b.name}
                  </h3>

                  {/* Deskripsi fungsi */}
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-3">
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
