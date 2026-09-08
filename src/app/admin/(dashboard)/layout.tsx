import type { ReactNode } from 'react'

import { requireAdmin } from '@/lib/auth'
import { AdminShell } from '@/components/admin/shell'

/**
 * Layout untuk SEMUA halaman admin yang butuh proteksi + sidebar + header.
 * Diterapkan via route group `(dashboard)` — lihat catatan di `app/admin/layout.tsx`.
 *
 * URL mapping (group tidak mempengaruhi URL):
 *   /admin                          → app/admin/(dashboard)/page.tsx
 *   /admin/articles                 → app/admin/(dashboard)/articles/page.tsx  (agent lain)
 *   /admin/categories               → app/admin/(dashboard)/categories/page.tsx (agent lain)
 *   … dst.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin()
  return <AdminShell email={session.email}>{children}</AdminShell>
}
