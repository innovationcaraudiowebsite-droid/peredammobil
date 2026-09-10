'use client'

import { Loader2, LogOut } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useLogout } from '@/hooks/use-logout'
import { Button } from '@/components/ui/button'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

interface LogoutButtonProps {
  className?: string
  /** Use the compact icon-only layout (for small screens). */
  compact?: boolean
}

export function LogoutButton({ className, compact = false }: LogoutButtonProps) {
  const { loading, handleLogout } = useLogout()

  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? 'icon' : 'sm'}
      onClick={handleLogout}
      disabled={loading}
      aria-label="Logout"
      className={cn(
        'text-muted-foreground hover:text-foreground hover:bg-muted/80',
        className,
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <LogOut className="h-4 w-4" aria-hidden />
      )}
      {!compact && <span>Logout</span>}
    </Button>
  )
}

/**
 * Logout rendered as a DropdownMenuItem (for use inside DropdownMenu).
 * Calls the same shared `useLogout` hook supaya toast & redirect konsisten.
 */
export function LogoutMenuItem() {
  const { loading, handleLogout } = useLogout()
  return (
    <DropdownMenuItem
      onClick={handleLogout}
      variant="destructive"
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <LogOut className="h-4 w-4" aria-hidden />
      )}
      <span>Logout</span>
    </DropdownMenuItem>
  )
}
