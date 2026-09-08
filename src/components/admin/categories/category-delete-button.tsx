'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2, Loader2 } from 'lucide-react'

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

interface CategoryDeleteButtonProps {
  categoryId: string
  categoryName: string
  articleCount: number
}

export function CategoryDeleteButton({
  categoryId,
  categoryName,
  articleCount,
}: CategoryDeleteButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const blocked = articleCount > 0

  async function handleDelete() {
    if (isPending) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/categories/${categoryId}`, {
          method: 'DELETE',
        })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          toast.error(data.message || 'Gagal menghapus kategori.')
          setOpen(false)
          return
        }
        toast.success(`Kategori "${categoryName}" dihapus.`)
        setOpen(false)
        router.refresh()
      } catch (err) {
        console.error('[category-delete] error:', err)
        toast.error('Terjadi kesalahan jaringan. Coba lagi.')
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={blocked}
          title={
            blocked
              ? `Tidak bisa hapus — masih dipakai ${articleCount} artikel`
              : 'Hapus kategori'
          }
        >
          <Trash2 className="h-4 w-4" />
          Hapus
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus kategori "{categoryName}"?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini tidak dapat dibatalkan. Kategori akan dihapus permanen dari
            database. Artikel yang masih memakai kategori ini (jika ada) harus
            dipindahkan terlebih dahulu.
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
