'use client'

import Link from 'next/link'

import { SidebarNav } from './nav'
import { LogoutButton } from './logout-button'

interface SidebarContentProps {
  email: string
  role?: string // admin | editor | writer
  fullName?: string
  /** Called after any internal nav link is clicked (used to close mobile sheet). */
  onNavigate?: () => void
}

/**
 * The actual sidebar chrome — branded header + nav + user card.
 * Rendered both in the fixed desktop sidebar and inside the mobile Sheet.
 */
export function SidebarContent({ email, role = 'admin', fullName, onNavigate }: SidebarContentProps) {
  const initials = email.slice(0, 2).toUpperCase()
  const displayName = fullName || email
  const roleLabel = role === 'admin' ? 'Administrator' : role === 'editor' ? 'Editor' : role === 'writer' ? 'Writer' : 'User'

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-200">
      {/* Brand header */}
      <Link
        href="/admin"
        onClick={onNavigate}
        className="flex items-center gap-2.5 border-b border-slate-800/80 px-5 py-4 transition-colors hover:bg-slate-900/60"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 shadow-md ring-1 ring-amber-300/40">
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
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-bold text-white">Portal Admin</span>
          <span className="truncate text-[11px] text-slate-400">
            Peredam Mobil Jakarta
          </span>
        </div>
      </Link>

      {/* Nav (scrollable) */}
      <div
        className="custom-sidebar-scroll flex-1 overflow-y-auto"
        style={{ scrollbarWidth: 'thin' }}
      >
        <SidebarNav onNavigate={onNavigate} role={role} />
      </div>

      {/* User card footer */}
      <div className="border-t border-slate-800/80 p-3">
        <div className="flex items-center gap-3 rounded-lg bg-slate-900/60 p-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-xs font-bold text-white"
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-slate-100">
              {displayName}
            </div>
            <div className="text-[11px] text-slate-500">{roleLabel}</div>
          </div>
          <LogoutButton
            compact
            className="text-slate-400 hover:bg-slate-800 hover:text-white"
          />
        </div>
        <div className="mt-2 px-1 text-[10px] text-slate-600">
          v1.0 · Innovation Car Audio
        </div>
      </div>
    </div>
  )
}
