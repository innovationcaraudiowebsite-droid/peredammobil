'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LogIn, Search, Home as HomeIcon } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './theme-toggle'
import { SearchDialog } from './search-dialog'
import { cn } from '@/lib/utils'

type NavLink = { href: string; label: string }

const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Beranda' },
  { href: '/berita', label: 'Portal Berita' },
  { href: '/kategori/peredam-mobil', label: 'Peredam Mobil' },
  { href: '/kategori/upgrade-audio', label: 'Upgrade Audio' },
  { href: '/kategori/review-workshop', label: 'Review Workshop' },
  { href: '/kategori/tips-biaya', label: 'Tips & Biaya' },
]

/**
 * Header sticky — logo + desktop nav + search + dark toggle + Masuk link.
 * Mobile: hamburger menu (Sheet).
 *
 * Props:
 *  - siteName: untuk <title> & aria-label
 *  - logoUrl: optional image URL
 *  - tagline: optional short tagline for sr-only
 */
export function Header({
  siteName,
  logoUrl,
  tagline,
}: {
  siteName: string
  logoUrl?: string | null
  tagline?: string
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  // Close mobile menu when route changes
  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center gap-3 sm:gap-4">
          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden size-9"
                aria-label="Buka menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">{siteName} — Navigasi</SheetTitle>
              <SheetDescription className="sr-only">
                Menu utama portal {siteName}.
              </SheetDescription>
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={siteName}
                    className="h-8 w-auto"
                  />
                ) : (
                  <span className="inline-grid place-items-center size-9 rounded-md bg-amber-500 text-amber-950 font-bold text-sm">
                    PMJ
                  </span>
                )}
                <span className="font-bold text-base">{siteName}</span>
              </div>
              <nav className="px-2 py-2">
                {NAV_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors',
                      isActive(l.href) && 'bg-primary/10 text-primary',
                    )}
                  >
                    {l.href === '/' ? (
                      <HomeIcon className="size-4" />
                    ) : (
                      <span
                        className={cn(
                          'size-1.5 rounded-full',
                          isActive(l.href) ? 'bg-primary' : 'bg-muted-foreground/40',
                        )}
                      />
                    )}
                    {l.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto px-4 py-3 border-t border-border space-y-2">
                <Link
                  href="/pencarian"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  <Search className="size-4" />
                  Pencarian
                </Link>
                <Link
                  href="/admin/login"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-amber-600 hover:bg-amber-500/10"
                >
                  <LogIn className="size-4" />
                  Masuk Admin
                </Link>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 size-8 grid place-items-center rounded hover:bg-muted"
                aria-label="Tutup menu"
              >
                <X className="size-4" />
              </button>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label={`${siteName} — Beranda`}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={siteName}
                className="h-7 sm:h-8 w-auto"
              />
            ) : (
              <span className="inline-grid place-items-center size-8 sm:size-9 rounded-md bg-amber-500 text-amber-950 font-bold text-sm">
                PMJ
              </span>
            )}
            <span className="font-bold text-base sm:text-lg leading-none tracking-tight">
              {siteName}
            </span>
            {tagline && (
              <span className="hidden xl:inline text-xs text-muted-foreground ml-2 border-l border-border pl-3 max-w-[18rem] truncate">
                {tagline}
              </span>
            )}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 ml-2">
            {NAV_LINKS.map((l) => {
              const active = isActive(l.href)
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    'relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors hover:bg-muted hover:text-primary',
                    active ? 'text-primary' : 'text-foreground/80',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  {l.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-px h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <div className="hidden sm:block">
              <SearchDialog />
            </div>
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hidden sm:inline-flex border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
            >
              <Link href="/admin/login">
                <LogIn className="size-4" />
                <span className="ml-1.5">Masuk</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
