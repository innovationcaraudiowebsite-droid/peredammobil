'use client'

import * as React from 'react'
import Link from 'next/link'
import { Menu, X, MessageCircle, Home as HomeIcon } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/portal/theme-toggle'
import { cn } from '@/lib/utils'

/**
 * Landing header — sticky top, backdrop blur, nav ke section landing + WA button.
 * Mobile: hamburger menu (Sheet).
 *
 * Catatan: link "Beranda" scroll ke #hero (landing), bukan root path.
 */
const WA_NUMBER = '6282111222989'
const WA_LINK = `https://wa.me/${WA_NUMBER}`

type NavLink = { href: string; label: string; isAnchor?: boolean }

const NAV_LINKS: NavLink[] = [
  { href: '#hero', label: 'Beranda', isAnchor: true },
  { href: '#about', label: 'About', isAnchor: true },
  { href: '#edukasi', label: 'Edukasi', isAnchor: true },
  { href: '#paket', label: 'Paket', isAnchor: true },
  { href: '#artikel', label: 'Artikel', isAnchor: true },
  { href: '/berita', label: 'Portal Berita' },
]

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-shadow',
        scrolled && 'shadow-sm',
      )}
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center gap-3 sm:gap-4">
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
              <SheetTitle className="sr-only">
                Innovation Car Audio — Navigasi
              </SheetTitle>
              <SheetDescription className="sr-only">
                Menu utama landing page Innovation Car Audio.
              </SheetDescription>
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <span className="inline-grid place-items-center size-9 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-sm">
                  ICA
                </span>
                <span className="font-bold text-base bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                  Innovation Car Audio
                </span>
              </div>
              <nav className="px-2 py-2">
                {NAV_LINKS.map((l) => {
                  const isExternal = !l.isAnchor
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
                    >
                      {l.href === '#hero' ? (
                        <HomeIcon className="size-4" />
                      ) : (
                        <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                      )}
                      {l.label}
                      {isExternal && (
                        <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
                          /
                        </span>
                      )}
                    </Link>
                  )
                })}
              </nav>
              <div className="mt-auto px-4 py-3 border-t border-border space-y-2">
                <Button
                  asChild
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                  size="sm"
                >
                  <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="size-4" />
                    Chat WhatsApp
                  </a>
                </Button>
                <Link
                  href="/admin/login"
                  className="block rounded-md px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 text-center"
                >
                  Masuk Admin
                </Link>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 size-8 grid place-items-center rounded hover:bg-muted lg:hidden"
                aria-label="Tutup menu"
              >
                <X className="size-4" />
              </button>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0"
            aria-label="Innovation Car Audio — Beranda"
          >
            <span className="inline-grid place-items-center size-9 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-sm">
              ICA
            </span>
            <span className="font-bold text-base sm:text-lg leading-none tracking-tight bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
              Innovation Car Audio
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 ml-4">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors hover:bg-muted hover:text-amber-600 dark:hover:text-amber-400 text-foreground/80',
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <Button
              asChild
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" />
                <span className="hidden sm:inline">Chat WhatsApp</span>
                <span className="sm:hidden">WA</span>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
