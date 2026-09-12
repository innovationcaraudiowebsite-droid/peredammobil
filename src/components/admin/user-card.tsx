'use client'

import Link from 'next/link'
import { UserCircle, Settings, Moon, Sun, ChevronUp } from 'lucide-react'
import { useTheme } from 'next-themes'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/lib/store/sidebar-store'
import { useMounted } from '@/hooks/use-mounted'
import { LogoutMenuItem } from './logout-button'

interface UserCardProps {
  email: string
  role?: string // admin | editor | writer
  fullName?: string
  initials: string
  displayName: string
  roleLabel: string
  /** Called after user clicks a menu item that navigates (closes mobile sheet). */
  onNavigate?: () => void
  /** Override collapse state (fallback to store jika tidak di-pass). */
  isCollapsedOverride?: boolean
}

/**
 * User card di footer sidebar dengan dropdown menu:
 * - Profil Saya
 * - Pengaturan
 * - Toggle Dark Mode
 * - Logout
 *
 * Saat sidebar collapsed (72px), hanya avatar yang tampil tapi menu
 * dropdown tetap full-width (256px) saat dibuka.
 */
export function UserCard({
  email,
  role = 'admin',
  fullName,
  initials,
  displayName,
  roleLabel,
  onNavigate,
  isCollapsedOverride,
}: UserCardProps) {
  const store = useSidebarStore()
  const isCollapsed = isCollapsedOverride ?? store.isCollapsed
  const { theme, setTheme } = useTheme()
  // Avoid hydration mismatch — only render theme toggle after mount.
  const mounted = useMounted()

  const roleBadgeClass =
    role === 'admin'
      ? 'bg-amber-500/20 text-amber-300'
      : role === 'editor'
        ? 'bg-emerald-500/20 text-emerald-300'
        : role === 'writer'
          ? 'bg-slate-500/20 text-slate-300'
          : 'bg-slate-400/20 text-slate-300'

  return (
    <div className="border-t border-slate-800/80 p-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex w-full items-center gap-3 rounded-lg bg-slate-900/60 p-2.5 transition-colors hover:bg-slate-800',
              isCollapsed && 'justify-center',
            )}
            aria-label="Menu user"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-xs font-bold text-white"
              aria-hidden
            >
              {initials}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate text-xs font-medium text-slate-100">{displayName}</div>
                <span
                  className={cn(
                    'mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium',
                    roleBadgeClass,
                  )}
                >
                  {roleLabel}
                </span>
              </div>
            )}
            {!isCollapsed && (
              <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align={isCollapsed ? 'center' : 'end'}
          sideOffset={8}
          className="w-60"
        >
          <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
            {fullName ? fullName : email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/admin/profile" onClick={onNavigate}>
              <UserCircle />
              <span>Profil Saya</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/admin/settings" onClick={onNavigate}>
              <Settings />
              <span>Pengaturan</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            disabled={!mounted}
          >
            {mounted && theme === 'dark' ? <Sun /> : <Moon />}
            <span>{mounted && theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <LogoutMenuItem />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
