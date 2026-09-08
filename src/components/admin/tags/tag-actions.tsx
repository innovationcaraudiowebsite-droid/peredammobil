'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2, Loader2, AlertTriangle, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

/* -------------------------------------------------------------------------- */
/*  Tag search bar (URL-synced)                                              */
/* -------------------------------------------------------------------------- */

export function TagSearchBar({ initialQuery }: { initialQuery: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(initialQuery)
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(v: string) {
    setValue(v)
    if (debounceTimer) clearTimeout(debounceTimer)
    const params = new URLSearchParams(searchParams.toString())
    if (v.trim()) {
      params.set('q', v.trim())
    } else {
      params.delete('q')
    }
    const timer = setTimeout(() => {
      router.replace(`${pathname}?${params.toString()}`)
    }, 250)
    setDebounceTimer(timer)
  }

  function clear() {
    handleChange('')
  }

  return (
    <div className="relative w-full max-w-xs">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Cari tag..."
        className="pl-9 pr-9"
        aria-label="Cari tag"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Hapus pencarian"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Delete button with double confirmation (when articles connected)        */
/* -------------------------------------------------------------------------- */

interface TagDeleteButtonProps {
  tagId: string
  tagName: string
  articleCount: number
}

export function TagDeleteButton({
  tagId,
  tagName,
  articleCount,
}: TagDeleteButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [secondConfirm, setSecondConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const hasArticles = articleCount > 0

  function reset() {
    setSecondConfirm(false)
    setOpen(false)
  }

  async function handleDelete() {
    if (isPending) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/tags/${tagId}`, { method: 'DELETE' })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          toast.error(data.message || 'Gagal menghapus tag.')
          reset()
          return
        }
        if (data.disconnectedArticles && data.disconnectedArticles > 0) {
          toast.success(
            `Tag "${tagName}" dihapus. Diputus dari ${data.disconnectedArticles} artikel.`,
          )
        } else {
          toast.success(`Tag "${tagName}" dihapus.`)
        }
        reset()
        router.refresh()
      } catch (err) {
        console.error('[tag-delete] error:', err)
        toast.error('Terjadi kesalahan jaringan. Coba lagi.')
      }
    })
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setSecondConfirm(false)
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Hapus
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {secondConfirm && hasArticles
              ? `Konfirmasi akhir: hapus "${tagName}"?`
              : `Hapus tag "${tagName}"?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasArticles ? (
              secondConfirm ? (
                <span className="flex flex-col gap-2">
                  <span className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Tag ini dipakai <strong>{articleCount} artikel</strong>.
                      Hapus tetap akan <strong>disconnect</strong> tag dari
                      artikel tersebut — artikel tidak dihapus, hanya tidak lagi
                      memiliki tag ini.
                    </span>
                  </span>
                  <span>
                    Tindakan ini tidak dapat dibatalkan. Lanjutkan?
                  </span>
                </span>
              ) : (
                <span className="flex flex-col gap-2">
                  <span className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Tag ini dipakai <strong>{articleCount} artikel</strong>.
                      Hapus tetap akan disconnect tag dari artikel tersebut.
                    </span>
                  </span>
                  <span>
                    Lanjutkan untuk konfirmasi kedua.
                  </span>
                </span>
              )
            ) : (
              <span>
                Tindakan ini tidak dapat dibatalkan. Tag akan dihapus permanen
                dari database.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
          {hasArticles && !secondConfirm ? (
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                setSecondConfirm(true)
              }}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              Lanjutkan
            </AlertDialogAction>
          ) : (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Ya, Hapus Permanen'
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
