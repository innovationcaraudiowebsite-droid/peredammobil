import type { ReactNode } from 'react'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { AdminShell } from '@/components/admin/shell'

/**
 * Layout untuk SEMUA halaman admin yang butuh proteksi + sidebar + header.
 * Diterapkan via route group `(dashboard)` — lihat catatan di `app/admin/layout.tsx`.
 *
 * URL mapping (group tidak mempengaruhi URL):
 *   /admin                          → app/admin/(dashboard)/page.tsx
 *   /admin/articles                 → app/admin/(dashboard)/articles/page.tsx
 *   /admin/categories               → app/admin/(dashboard)/categories/page.tsx
 *   /admin/users                    → app/admin/(dashboard)/users/page.tsx
 *   /admin/profile                  → app/admin/(dashboard)/profile/page.tsx
 *   … dst.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin()
  // Fetch fullName untuk tampil di sidebar/header (lebih ramah dari email)
  let fullName: string | undefined
  try {
    const profile = await db.profile.findUnique({
      where: { id: session.userId },
      select: { fullName: true },
    })
    fullName = profile?.fullName || undefined
  } catch {
    // ignore — fallback ke email
  }
  return (
    <AdminShell
      email={session.email}
      role={session.role}
      fullName={fullName}
    >
      {children}
    </AdminShell>
  )
}

