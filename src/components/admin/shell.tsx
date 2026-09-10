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
import { NotificationBell } from './notification-bell'
import { useSidebarStore } from '@/lib/store/sidebar-store'

interface AdminShellProps {
  email: string
  role?: string // admin | editor | writer
  fullName?: string
  /** Pending comments count untuk notification bell badge. */
  pendingCommentsCount?: number
  children: React.ReactNode
}

export function AdminShell({
  email,
  role = 'admin',
  fullName,
  pendingCommentsCount = 0,
  children,
}: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const initials = email.slice(0, 2).toUpperCase()
  const displayName = fullName || email

  const roleLabel =
    role === 'admin'
      ? 'Administrator'
      : role === 'editor'
        ? 'Editor'
        : role === 'writer'
          ? 'Writer'
          : 'User'
  const roleBadgeClass =
    role === 'admin'
      ? 'bg-amber-500 text-white'
      : role === 'editor'
        ? 'bg-emerald-500 text-white'
        : role === 'writer'
          ? 'bg-slate-500 text-white'
          : 'bg-slate-400 text-white'

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop fixed sidebar (lg+) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        <SidebarContent
          email={email}
          role={role}
          fullName={fullName}
          pendingCommentsCount={pendingCommentsCount}
        />
      </aside>

      {/* Mobile sheet (controlled externally) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-72 gap-0 p-0 sm:max-w-xs"
        >
          <SheetTitle className="sr-only">Menu navigasi admin</SheetTitle>
          {/* Mobile sidebar selalu expanded (forceExpanded) — ignore desktop collapse state */}
          <SidebarContent
            email={email}
            role={role}
            fullName={fullName}
            onNavigate={() => setMobileOpen(false)}
            forceExpanded
            pendingCommentsCount={pendingCommentsCount}
          />
        </SheetContent>
      </Sheet>

      {/* Main column — lebar disesuaikan dengan state sidebar (lg+ only) */}
      <SidebarAwareMain
        pendingCommentsCount={pendingCommentsCount}
        initials={initials}
        displayName={displayName}
        roleLabel={roleLabel}
        roleBadgeClass={roleBadgeClass}
        onOpenMobile={() => setMobileOpen(true)}
      >
        {children}
      </SidebarAwareMain>
    </div>
  )
}

/**
 * Main column yang membaca `isCollapsed` dari Zustand store untuk
 * menentukan padding-left dinamis (256px ↔ 72px). Dipisah ke komponen
 * sendiri supaya hydration mismatch bisa di-handle dengan pattern
 * `mounted` (lazy apply padding after client mount).
 */
function SidebarAwareMain({
  children,
  initials,
  displayName,
  roleLabel,
  roleBadgeClass,
  pendingCommentsCount,
  onOpenMobile,
}: {
  children: React.ReactNode
  initials: string
  displayName: string
  roleLabel: string
  roleBadgeClass: string
  pendingCommentsCount: number
  onOpenMobile: () => void
}) {
  const { isCollapsed } = useSidebarStore()

  // Dynamic main column offset (only applies lg+) — match sidebar width.
  // Sidebar 256px ↔ 72px; pakai arbitrary value untuk pixel-perfect align
  // dengan inline style sidebar di SidebarContent.
  const mainPaddingClass = isCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[256px]'

  return (
    <div
      className={cn(
        'flex min-h-screen flex-col transition-[padding] duration-300 ease-in-out',
        mainPaddingClass,
      )}
    >
      {/* Header */}
      <header className="sticky top-0 z-30 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-full items-center gap-2 px-3 sm:gap-3 sm:px-4">
          {/* Hamburger (mobile only) */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('lg:hidden')}
            onClick={onOpenMobile}
            aria-label="Buka menu navigasi"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Breadcrumb */}
          <div className="min-w-0 flex-1">
            <AdminBreadcrumb />
          </div>

          {/* Notification + user + logout */}
          <div className="flex items-center gap-1 sm:gap-2">
            <NotificationBell pendingCount={pendingCommentsCount} />
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
              <span
                className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${roleBadgeClass}`}
              >
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
  )
}

