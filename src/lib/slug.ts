/**
 * Slug helpers — konversi string bebas menjadi slug aman untuk URL.
 *
 * Aturan:
 * - lowercase
 * - ganti spasi / underscore / tab / multiple dashes → single dash
 * - hapus karakter non-alfanumerik (kecuali dash)
 * - trim dash di awal/akhir
 * - untuk karakter beraksen (Indonesia), lakukan normalisasi NFC lalu strip diacritics
 */

/**
 * Konversi string bebas menjadi URL-safe slug.
 */
export function slugify(input: string): string {
  if (!input) return ''
  // Normalisasi unicode → pisahkan diacritics dari base char.
  const normalized = input.normalize('NFKD')
  // Hapus combining marks (diacritics), artinya é → e, ñ → n
  const stripped = normalized.replace(/[\u0300-\u036f]/g, '')
  return stripped
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // buang simbol kecuali spasi & dash
    .replace(/[\s_]+/g, '-') // spasi/underscore → dash
    .replace(/-+/g, '-') // multi dash → single dash
    .replace(/^-+|-+$/g, '') // trim dash
}

/**
 * Pastikan slug unik dengan menambahkan suffix -2, -3, dst bila terjadi konflik.
 *
 * @param baseSlug slug awal
 * @param isTaken function asinkron yang menerima slug candidate → return true jika sudah dipakai
 * @param ignoreId (opsional) id artikel yang sedang di-edit (slug miliknya tidak dihitung sebagai konflik)
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = baseSlug || 'artikel'
  if (!(await isTaken(base))) return base
  let i = 2
  // Batasi 100 iterasi untuk menghindari infinite loop.
  while (i < 100) {
    const candidate = `${base}-${i}`
    if (!(await isTaken(candidate))) return candidate
    i++
  }
  return `${base}-${Date.now()}`
}
