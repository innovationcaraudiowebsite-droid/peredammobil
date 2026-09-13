/**
 * Jenis Bahan Peredam & Fungsinya section — section id="edukasi".
 * Sesuai permintaan user: tampilkan 4 jenis bahan peredam (Butyl, Absorber,
 * Spant, Nex) dengan deskripsi singkat fungsi masing-masing.
 *
 * Layout: grid 2×2 (mobile: 1 kolom). Tiap card punya nomor besar (amber),
 * nama bahan, dan deskripsi fungsi.
 */

type BahanItem = {
  no: number
  name: string
  fungsi: string
}

const BAHAN_LIST: BahanItem[] = [
  {
    no: 1,
    name: 'Butyl',
    fungsi:
      'Peredam getaran utama yang dipasang langsung ke pelat logam (pintu, lantai, kap mesin). Butyl rubber tebal 2–4mm menyerap getaran mesin & jalan, menambah massa pelat sehingga mengurangi resonansi. Tahan panas dan tidak meleleh di suhu Jakarta.',
  },
  {
    no: 2,
    name: 'Absorber',
    fungsi:
      'Material busa / foam berdaya serap tinggi yang menyerap suara udara di dalam kabin. Dipasang di atas lapisan butyl untuk menangkap frekuensi menengah-tinggi. Cocok untuk plafon, door trim, dan bawah kursi.',
  },
  {
    no: 3,
    name: 'Spant',
    fungsi:
      'Lapisan barrier (biasanya Mass Loaded Vinyl / MLV) yang menahan suara lolos dari luar ke kabin. Berat 1–4 kg/m², dipasang di lantai dan firewall. Efektif untuk frekuensi rendah mesin diesel & knalpot.',
  },
  {
    no: 4,
    name: 'Nex',
    fungsi:
      'Lapisan akustik komposit (kombinasi foam + barrier + foil) all-in-one. Praktis untuk area sempit, dipasang di pintu setelah butyl, atau di plafon. Memberikan damping + absorpsi + barrier dalam satu lapisan.',
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

        {/* Grid 2×2 — 4 jenis bahan */}
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {BAHAN_LIST.map((b) => (
            <li
              key={b.no}
              className="rounded-xl border border-border bg-card p-4 sm:p-6 transition-all duration-200 hover:shadow-md hover:border-amber-500/40"
            >
              <div className="flex items-start gap-4">
                {/* Nomor besar */}
                <span
                  className="shrink-0 flex size-12 sm:size-14 items-center justify-center rounded-full bg-amber-500 text-xl sm:text-2xl font-bold text-white tabular-nums"
                  aria-hidden
                >
                  {b.no}
                </span>

                {/* Konten */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold leading-tight">
                    {b.name}
                  </h3>
                  <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
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
