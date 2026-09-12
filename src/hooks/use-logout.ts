'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { useToast } from '@/hooks/use-toast'

/**
 * Shared logout logic — POST /api/admin/logout, tampilkan toast, lalu
 * redirect ke /admin/login. Dipakai oleh LogoutButton (sidebar / header)
 * dan LogoutMenuItem (user card dropdown).
 */
export function useLogout() {
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

  return { loading, handleLogout }
}
