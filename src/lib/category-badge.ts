/**
 * Helper untuk badge kategori — aman untuk client component (no server-only).
 *
 * Dipakai di:
 *  - articles-list.tsx (client component, infinite scroll)
 *  - latest-articles.tsx (server component)
 *  - portal article card
 */

export type CategoryColor =
  | 'amber'
  | 'red'
  | 'emerald'
  | 'slate'
  | 'violet'
  | 'rose'
  | 'cyan'
  | 'zinc'
  | string

/**
 * Konversi string warna kategori (DB) ke class Tailwind untuk badge.
 * Fallback: amber.
 */
export function categoryBadgeClass(color: CategoryColor | null | undefined): string {
  switch (color) {
    case 'amber':
      return 'bg-amber-500 text-white'
    case 'red':
      return 'bg-rose-500 text-white'
    case 'emerald':
      return 'bg-emerald-500 text-white'
    case 'slate':
      return 'bg-slate-600 text-white'
    case 'violet':
      return 'bg-violet-500 text-white'
    case 'rose':
      return 'bg-rose-500 text-white'
    case 'cyan':
      return 'bg-cyan-500 text-white'
    case 'zinc':
      return 'bg-zinc-600 text-white'
    default:
      return 'bg-amber-500 text-white'
  }
}
