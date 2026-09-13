import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { LoginForm } from './form'

export const metadata = {
  title: 'Login Admin — Peredam Mobil Jakarta',
  description: 'Masuk ke dashboard admin Peredam Mobil Jakarta',
  robots: { index: false, follow: false },
}

export default async function AdminLoginPage() {
  // If already authenticated, bounce to dashboard
  const session = await getSession()
  if (session) {
    redirect('/admin')
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-amber-500 via-orange-600 to-slate-900">
      {/* Decorative blurred blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-orange-700/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-slate-900/20 blur-3xl"
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Branding */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm shadow-lg">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-9 w-9 text-amber-50"
                aria-hidden
              >
                <path d="M5 17h14M6 17l1.5-5.5A2 2 0 0 1 9.4 10h5.2a2 2 0 0 1 1.9 1.5L18 17" />
                <path d="M7 17v2M17 17v2" />
                <circle cx="8" cy="17" r="1.2" />
                <circle cx="16" cy="17" r="1.2" />
                <path d="M9 7c1.5-1.5 4.5-1.5 6 0" />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
              Peredam Mobil Jakarta
            </h1>
            <p className="mt-1 text-sm font-medium text-amber-100/80">
              Dashboard Admin
            </p>
          </div>

          <LoginForm />

          <p className="mt-6 text-center text-xs text-amber-100/70">
            <a
              href="/"
              className="underline-offset-2 hover:text-white hover:underline transition-colors"
            >
              ← Kembali ke portal
            </a>
          </p>

          <p className="mt-4 text-center text-[11px] text-amber-100/50">
            © {new Date().getFullYear()} Peredam Mobil Jakarta
          </p>
        </div>
      </div>
    </main>
  )
}
