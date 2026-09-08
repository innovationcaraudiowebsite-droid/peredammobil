'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'

interface LogoutButtonProps {
  className?: string
  /** Use the compact icon-only layout (for small screens). */
  compact?: boolean
}

export function LogoutButton({ className, compact = false }: LogoutButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('logout failed')
      toast({
        title: 'Berhasil logout',
        description: 'Anda akan diarahkan ke halaman login.',
      })
      // small delay so the toast can render before navigate
      setTimeout(() => router.push('/admin/login'), 200)
      // hard fallback in case client navigation is intercepted
      setTimeout(() => {
        window.location.href = '/admin/login'
      }, 1200)
    } catch {
      setLoading(false)
      toast({
        title: 'Gagal logout',
        description: 'Terjadi kesalahan. Coba lagi.',
        variant: 'destructive',
      })
    }
  }

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
