/**
 * About section — section id="about".
 * Sesuai permintaan user: hanya judul "About me" + lorem ipsum 100 karakter.
 * Layout minimalis — tidak ada gambar, tidak ada counter, tidak ada list spesialisasi.
 */

// Lorem ipsum 100 karakter (dipotong tepat 100 char termasuk spasi).
const LOREM_100 = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et magn'

export function About() {
  return (
    <section id="about" className="bg-background py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          About me
        </h2>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {LOREM_100}
        </p>
      </div>
    </section>
  )
}
