'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { SidebarNav } from './nav'
import { UserCard } from './user-card'
import { useSidebarStore } from '@/lib/store/sidebar-store'

interface SidebarContentProps {
  email: string
  role?: string // admin | editor | writer
  fullName?: string
  /** Called after any internal nav link is clicked (used to close mobile sheet). */
  onNavigate?: () => void
  /**
   * Force sidebar ke mode expanded (ignore Zustand `isCollapsed`).
   * Dipakai untuk mobile Sheet drawer supaya selalu full-width 256px.
   */
  forceExpanded?: boolean
  /** Pending comments count untuk badge di item Komentar. */
  pendingCommentsCount?: number
}

/**
 * The actual sidebar chrome — branded header + collapse toggle + quick action
 * + search + nav + user card.
 *
 * Rendered both in the fixed desktop sidebar and inside the mobile Sheet.
 * Lebar sidebar (72px collapsed ↔ 256px expanded) diatur dari sini via
 * inline style, supaya smooth transition (300ms) saat toggle.
 */
export function SidebarContent({
  email,
  role = 'admin',
  fullName,
  onNavigate,
  forceExpanded = false,
  pendingCommentsCount,
}: SidebarContentProps) {
  const { isCollapsed: storeCollapsed, toggleCollapse } = useSidebarStore()
  // Saat forceExpanded (mobile sheet), override ke mode expanded.
  const isCollapsed = forceExpanded ? false : storeCollapsed
  const router = useRouter()
  const [search, setSearch] = useState('')

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

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = search.trim()
    if (!q) {
      router.push('/admin/articles')
    } else {
      router.push(`/admin/articles?q=${encodeURIComponent(q)}`)
    }
    onNavigate?.()
  }

  return (
    <div
      className="custom-sidebar-scroll flex h-full flex-col bg-slate-950 text-slate-200 transition-[width] duration-300 ease-in-out"
      style={{ width: isCollapsed ? '72px' : '256px' }}
    >
      {/* Brand header + collapse toggle */}
      <div className="border-b border-slate-800/80">
        <Link
          href="/admin"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-2.5 transition-colors hover:bg-slate-900/60',
            isCollapsed ? 'justify-center px-2 py-4' : 'px-4 py-4',
          )}
          aria-label="Dashboard Admin"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 shadow-md ring-1 ring-amber-300/40">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5 text-white"
              aria-hidden
            >
              <path
                d="M5 17h14M6 17l1.5-5.5A2 2 0 0 1 9.4 10h5.2a2 2 0 0 1 1.9 1.5L18 17"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7 17v2M17 17v2"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
              />
              <circle cx="8" cy="17" r="1.2" fill="currentColor" />
              <circle cx="16" cy="17" r="1.2" fill="currentColor" />
            </svg>
          </div>
          {!isCollapsed && (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-bold text-white">Portal Admin</span>
              <span className="truncate text-[11px] text-slate-400">
                Peredam Mobil Jakarta
              </span>
            </div>
          )}
        </Link>

        {/* Collapse toggle (desktop only — hidden on mobile sheet) */}
        <div className={cn('border-t border-slate-800/50', isCollapsed ? 'px-2 py-2' : 'px-3 py-2')}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleCollapse}
                aria-label={isCollapsed ? 'Lebarkan sidebar' : 'Persempit sidebar'}
                aria-expanded={!isCollapsed}
                className={cn(
                  'flex items-center gap-2 rounded-md text-slate-400 transition-colors hover:bg-slate-800 hover:text-white',
                  isCollapsed ? 'h-9 w-9 justify-center' : 'w-full px-3 py-1.5 text-xs font-medium',
                )}
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4 shrink-0" />
                ) : (
                  <>
                    <PanelLeftClose className="h-4 w-4 shrink-0" />
                    <span>Ciutkan</span>
                  </>
                )}
              </button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" className="bg-slate-900 text-slate-100 border-slate-700">
                Lebarkan sidebar
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>

      {/* Quick action — Tambah Artikel */}
      {!isCollapsed ? (
        <div className="px-3 py-3">
          <Button asChild className="w-full bg-amber-500 text-white shadow-md hover:bg-amber-600">
            <Link href="/admin/articles/new" onClick={onNavigate}>
              <Plus className="h-4 w-4" />
              <span>Tambah Artikel</span>
            </Link>
          </Button>
        </div>
      ) : (
        <div className="px-2 py-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                size="icon"
                className="w-9 bg-amber-500 text-white shadow-md hover:bg-amber-600"
              >
                <Link href="/admin/articles/new" onClick={onNavigate} aria-label="Tambah Artikel">
                  <Plus className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-slate-900 text-slate-100 border-slate-700">
              Tambah Artikel
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Search box (expanded only) */}
      {!isCollapsed && (
        <form onSubmit={handleSearchSubmit} className="px-3 pb-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              type="search"
              placeholder="Cari artikel…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-slate-700 bg-slate-900 pl-8 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus-visible:border-amber-500 focus-visible:ring-amber-500/30"
              aria-label="Cari artikel"
            />
          </div>
        </form>
      )}

      {/* Nav (scrollable) */}
      <div
        className="custom-sidebar-scroll flex-1 overflow-y-auto"
        style={{ scrollbarWidth: 'thin' }}
      >
        <SidebarNav
          onNavigate={onNavigate}
          role={role}
          isCollapsedOverride={isCollapsed}
          pendingCommentsCount={pendingCommentsCount}
        />
      </div>

      {/* User card footer dengan dropdown */}
      <UserCard
        email={email}
        role={role}
        fullName={fullName}
        initials={initials}
        displayName={displayName}
        roleLabel={roleLabel}
        onNavigate={onNavigate}
        isCollapsedOverride={isCollapsed}
      />
    </div>
  )
}
