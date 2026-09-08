import type { ReactNode } from 'react'

/**
 * Base admin layout — minimal pass-through.
 *
 * Why this is empty:
 * The actual admin chrome (sidebar + header + `requireAdmin`) lives in
 * `src/app/admin/(dashboard)/layout.tsx` and is applied ONLY to pages inside
 * the `(dashboard)` route group (URL /admin, /admin/articles, /admin/categories, …).
 *
 * The login page at `/admin/login` is NOT in the `(dashboard)` group, so it
 * bypasses `requireAdmin` — otherwise the layout would issue a
 * `redirect('/admin/login')` from inside the login page itself (infinite loop).
 *
 * Future agents adding new admin pages: create them under
 * `src/app/admin/(dashboard)/...` to inherit the protected layout automatically.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
