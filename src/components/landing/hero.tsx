import Image from 'next/image'

/**
 * Hero section — section id="hero".
 * Hanya gambar hero (banner lengkap dari user — sudah berisi judul
 * "Peredam Mobil Jakarta", subtitle, dan 3 icon fitur). Tidak ada counter,
 * tidak ada text overlay, tidak ada CTA button. Layout = gambar full-bleed
 * dengan rasio asli (1717×916 ≈ 1.87:1).
 */
export function Hero() {
  return (
    <section id="hero" className="relative w-full overflow-hidden bg-white">
      <Image
        src="/hero-peredam-mobil-jakarta.png"
        alt="Peredam Mobil Jakarta — Panduan Lengkap Material dan Cara Pasang yang Benar"
        width={1717}
        height={916}
        priority
        sizes="100vw"
        className="h-auto w-full"
      />
    </section>
  )
}
