'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2, Loader2, ArrowUp, ArrowDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
/*  Delete button                                                             */
/* -------------------------------------------------------------------------- */

interface FaqDeleteButtonProps {
  faqId: string
  question: string
}

export function FaqDeleteButton({ faqId, question }: FaqDeleteButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleDelete() {
    if (isPending) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/faq/${faqId}`, { method: 'DELETE' })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          toast.error(data.message || 'Gagal menghapus FAQ.')
          setOpen(false)
          return
        }
        toast.success('FAQ dihapus.')
        setOpen(false)
        router.refresh()
      } catch (err) {
        console.error('[faq-delete] error:', err)
        toast.error('Terjadi kesalahan jaringan. Coba lagi.')
      }
    })
  }

  // truncate for display
  const preview = question.length > 80 ? question.slice(0, 80) + '…' : question

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
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
          <AlertDialogTitle>Hapus FAQ?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini tidak dapat dibatalkan. FAQ berikut akan dihapus permanen:
            <span className="mt-2 block rounded-md bg-muted p-2 text-sm text-foreground">
              &ldquo;{preview}&rdquo;
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
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
              'Ya, Hapus'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/* -------------------------------------------------------------------------- */
/*  Reorder buttons (move up/down)                                           */
/* -------------------------------------------------------------------------- */

interface FaqReorderButtonsProps {
  isFirst: boolean
  isLast: boolean
  onMove: (direction: 'up' | 'down') => void
  disabled?: boolean
}

export function FaqReorderButtons({
  isFirst,
  isLast,
  onMove,
  disabled = false,
}: FaqReorderButtonsProps) {
  return (
    <div className="flex items-center gap-0.5">
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0"
        onClick={() => onMove('up')}
        disabled={isFirst || disabled}
        title="Pindah ke atas"
        aria-label="Pindah FAQ ke atas"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0"
        onClick={() => onMove('down')}
        disabled={isLast || disabled}
        title="Pindah ke bawah"
        aria-label="Pindah FAQ ke bawah"
      >
        <ArrowDown className="h-4 w-4" />
      </Button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Toast for "still working" status                                          */
/* -------------------------------------------------------------------------- */

export function useFaqReorder() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function move(faqId: string, ids: string[], direction: 'up' | 'down') {
    if (isPending) return
    startTransition(async () => {
      const idx = ids.indexOf(faqId)
      if (idx < 0) {
        toast.error('FAQ tidak ditemukan di list.')
        return
      }
      const target = direction === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= ids.length) return // already at edge

      // swap
      const newIds = ids.slice()
      ;[newIds[idx], newIds[target]] = [newIds[target], newIds[idx]]

      try {
        const res = await fetch('/api/admin/faq/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: newIds }),
        })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          toast.error(data.message || 'Gagal menyimpan urutan baru.')
          return
        }
        router.refresh()
      } catch (err) {
        console.error('[faq-reorder] error:', err)
        toast.error('Terjadi kesalahan jaringan. Coba lagi.')
      }
    })
  }

  return { isPending, move }
}
