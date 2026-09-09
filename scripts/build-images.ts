/**
 * Build static images for SEO:
 *  - public/og-default.png       (1200×630)
 *  - public/apple-touch-icon.png (180×180)
 *  - public/icon-192.png         (192×192)
 *  - public/icon-512.png         (512×512)
 *  - public/favicon.ico          (32×32 PNG-wrapped ICO)
 *
 * Run: bun run scripts/build-images.ts
 */
import sharp from 'sharp'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

const PUB = path.resolve(process.cwd(), 'public')

/* -------------------------------------------------------------------------- */
/*  OG default image — 1200×630 branded card                                  */
/* -------------------------------------------------------------------------- */

const ogSvg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="amber" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="14" fill="url(#amber)"/>

  <!-- Logo badge -->
  <rect x="80" y="100" width="120" height="120" rx="20" fill="url(#amber)"/>
  <text x="140" y="178" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="60" fill="#0f172a">PMJ</text>

  <!-- Brand name -->
  <text x="220" y="148" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="42" fill="#ffffff">Peredam Mobil Jakarta</text>
  <text x="220" y="190" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="24" fill="#f59e0b">Review Workshop Peredam &amp; Upgrade Audio Terbaik</text>

  <!-- Headline -->
  <text x="80" y="350" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="58" fill="#ffffff">Panduan Peredam Mobil &amp; Audio</text>
  <text x="80" y="420" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="44" fill="#f1f5f9">Berdasarkan Pengalaman Nyata Jakarta</text>

  <!-- URL bar -->
  <rect x="80" y="500" width="600" height="50" rx="12" fill="#334155"/>
  <text x="100" y="535" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="24" fill="#f8fafc">peredammobiljakarta.com</text>
</svg>`

/* -------------------------------------------------------------------------- */
/*  Square icon SVG (logo on amber background)                                 */
/* -------------------------------------------------------------------------- */

function squareIconSvg(size: number, padding: number, fontSize: number) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="amber" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#amber)"/>
  <rect x="${padding}" y="${padding}" width="${size - padding * 2}" height="${size - padding * 2}" rx="${size * 0.18}" fill="#0f172a" opacity="0.85"/>
  <text x="${size / 2}" y="${size / 2 + fontSize * 0.35}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="${fontSize}" fill="#ffffff">PMJ</text>
</svg>`
}

/* -------------------------------------------------------------------------- */
/*  PNG → ICO wrapper (32×32) — Vista+ supports PNG-embedded ICO.              */
/* -------------------------------------------------------------------------- */

function pngToIco(pngBuffer: Buffer, width = 32, height = 32): Buffer {
  // ICONDIR (6 bytes)
  // ICONDIRENTRY (16 bytes per image)
  // PNG bytes
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type = 1 (icon)
  header.writeUInt16LE(1, 4) // count = 1

  const dir = Buffer.alloc(16)
  dir.writeUInt8(width >= 256 ? 0 : width, 0)
  dir.writeUInt8(height >= 256 ? 0 : height, 1)
  dir.writeUInt8(0, 2) // colors in palette
  dir.writeUInt8(0, 3) // reserved
  dir.writeUInt16LE(1, 4) // color planes
  dir.writeUInt16LE(32, 6) // bits per pixel
  dir.writeUInt32LE(pngBuffer.length, 8) // size
  dir.writeUInt32LE(6 + 16, 12) // offset to image data

  return Buffer.concat([header, dir, pngBuffer])
}

async function main() {
  console.log('Building OG image (1200×630)...')
  const ogPng = await sharp(Buffer.from(ogSvg)).png().toBuffer()
  await writeFile(path.join(PUB, 'og-default.png'), ogPng)

  console.log('Building apple-touch-icon (180×180)...')
  const applePng = await sharp(Buffer.from(squareIconSvg(180, 0, 90))).png().toBuffer()
  await writeFile(path.join(PUB, 'apple-touch-icon.png'), applePng)

  console.log('Building icon-192.png...')
  const icon192 = await sharp(Buffer.from(squareIconSvg(192, 16, 100))).png().toBuffer()
  await writeFile(path.join(PUB, 'icon-192.png'), icon192)

  console.log('Building icon-512.png...')
  const icon512 = await sharp(Buffer.from(squareIconSvg(512, 40, 260))).png().toBuffer()
  await writeFile(path.join(PUB, 'icon-512.png'), icon512)

  console.log('Building favicon.ico (32×32)...')
  const favPng = await sharp(Buffer.from(squareIconSvg(32, 0, 18))).png().toBuffer()
  const ico = pngToIco(favPng, 32, 32)
  await writeFile(path.join(PUB, 'favicon.ico'), ico)

  console.log('\nAll images generated successfully in /public')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
