'use client'

import Link from 'next/link'
import { Bell, MessageSquare } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface NotificationBellProps {
  /** Jumlah komentar pending yang menunggu moderasi. */
  pendingCount?: number
}

/**
 * Notification bell di header admin. Menampilkan badge merah berisi
 * `pendingCount` kalau > 0, dengan popover ringan berisi link ke
 * halaman moderasi komentar (filter `status=PENDING`).
 */
export function NotificationBell({ pendingCount = 0 }: NotificationBellProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifikasi${pendingCount > 0 ? ` (${pendingCount} baru)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {pendingCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 animate-pulse items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-background"
              aria-hidden
            >
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
              <MessageSquare className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-semibold">Notifikasi</h3>
          </div>
          {pendingCount > 0 ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{pendingCount}</span>{' '}
              komentar menunggu moderasi Anda.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tidak ada notifikasi baru. Semua sudah ditangani.
            </p>
          )}
          <Button asChild size="sm" variant="outline" className="w-full">
            <Link href="/admin/comments?status=pending">
              {pendingCount > 0 ? 'Tinjau Komentar' : 'Lihat Komentar'}
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
