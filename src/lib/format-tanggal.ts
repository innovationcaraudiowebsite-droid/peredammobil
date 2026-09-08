/**
 * Helpers format tanggal & waktu untuk tampilan portal front-end (Bahasa Indonesia).
 */

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

/** Format: "Senin, 5 September 2026" — tanpa jam. */
export function formatTanggalPanjang(date: Date | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** Format pendek: "5 Sep 2026". */
export function formatTanggalPendek(date: Date | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const m = MONTHS[d.getMonth()].slice(0, 3)
  return `${d.getDate()} ${m} ${d.getFullYear()}`
}

/** Format jam: "09.30 WIB". */
export function formatJam(date: Date | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}.${mm} WIB`
}

/** Relative time Indonesian: "5 menit lalu", "2 jam lalu", "3 hari lalu", fallback ke tanggal. */
export function relativeTime(date: Date | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const now = Date.now()
  const diffMs = now - d.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'baru saja'
  if (diffMin < 60) return `${diffMin} menit lalu`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} jam lalu`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay} hari lalu`
  return formatTanggalPendek(d)
}

/** Format angka dengan separator ribuan Indonesian: 19082 → "19.082". */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n)
}
