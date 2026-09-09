'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'

import { SidebarContent } from './sidebar'
import { AdminBreadcrumb } from './breadcrumb'
import { LogoutButton } from './logout-button'

interface AdminShellProps {
  email: string
  role?: string // admin | editor | writer
  fullName?: string
  children: React.ReactNode
}

export function AdminShell({ email, role = 'admin', fullName, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const initials = email.slice(0, 2).toUpperCase()
  const displayName = fullName || email

  const roleLabel =
    role === 'admin' ? 'Administrator' :
    role === 'editor' ? 'Editor' :
    role === 'writer' ? 'Writer' : 'User'
  const roleBadgeClass =
    role === 'admin' ? 'bg-amber-500 text-white' :
    role === 'editor' ? 'bg-emerald-500 text-white' :
    role === 'writer' ? 'bg-slate-500 text-white' : 'bg-slate-400 text-white'

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop fixed sidebar (lg+) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 lg:block">
        <SidebarContent email={email} role={role} />
      </aside>

      {/* Mobile sheet (controlled externally) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-72 gap-0 p-0 sm:max-w-xs"
        >
          <SheetTitle className="sr-only">Menu navigasi admin</SheetTitle>
          <SidebarContent
            email={email}
            role={role}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main column (offset by sidebar on lg+) */}
      <div className="flex min-h-screen flex-col lg:pl-60">
        {/* Header */}
        <header className="sticky top-0 z-30 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex h-full items-center gap-2 px-3 sm:gap-3 sm:px-4">
            {/* Hamburger (mobile only) */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn('lg:hidden')}
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu navigasi"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Breadcrumb */}
            <div className="min-w-0 flex-1">
              <AdminBreadcrumb />
            </div>

            {/* User + logout */}
            <div className="flex items-center gap-2">
              <div
                className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-xs font-bold text-white sm:flex"
                aria-hidden
              >
                {initials}
              </div>
              <div className="hidden flex-col text-right leading-tight sm:flex">
                <span className="max-w-[180px] truncate text-xs font-medium text-foreground">
                  {displayName}
                </span>
                <span className={`inline-block mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${roleBadgeClass}`}>
                  {roleLabel}
                </span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
