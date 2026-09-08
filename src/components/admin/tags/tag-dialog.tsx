'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { slugify } from '@/lib/slug'

/* -------------------------------------------------------------------------- */
/*  Form (mounts only when dialog open → fresh state per open)               */
/* -------------------------------------------------------------------------- */

interface TagFormProps {
  onClose: () => void
}

function TagForm({ onClose }: TagFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  function handleNameChange(v: string) {
    setName(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  function handleSlugChange(v: string) {
    setSlugTouched(true)
    setSlug(slugify(v))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isPending) return
    if (!name.trim() || name.trim().length < 2) {
      toast.error('Nama tag wajib minimal 2 karakter.')
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim(),
          }),
        })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          toast.error(data.message || 'Gagal menambah tag.')
          return
        }
        toast.success('Tag ditambahkan.')
        onClose()
        router.refresh()
      } catch (err) {
        console.error('[tag-dialog] submit error:', err)
        toast.error('Terjadi kesalahan jaringan. Coba lagi.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="tag-name">
          Nama Tag <span className="text-destructive">*</span>
        </Label>
        <Input
          id="tag-name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="contoh: Butyl"
          required
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tag-slug">Slug</Label>
        <Input
          id="tag-slug"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder="auto-dari-nama"
        />
        <p className="text-xs text-muted-foreground">
          Otomatis dari nama. Bisa diedit manual — akan dinormalisasi.
        </p>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Tambah
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

/* -------------------------------------------------------------------------- */
/*  Dialog component                                                          */
/* -------------------------------------------------------------------------- */

interface TagDialogProps {
  trigger?: React.ReactNode
}

export function TagDialog({ trigger }: TagDialogProps) {
  const [open, setOpen] = useState(false)

  const defaultTrigger = (
    <Button className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700">
      <Plus className="h-4 w-4" />
      Tag Baru
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Tag Baru</DialogTitle>
          <DialogDescription>
            Tag dipakai untuk menandai topik artikel. Bisa dipakai banyak
            artikel sekaligus.
          </DialogDescription>
        </DialogHeader>

        {open && <TagForm onClose={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  )
}
