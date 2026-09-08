'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Pencil, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { slugify } from '@/lib/slug'

/* -------------------------------------------------------------------------- */
/*  Types & color palette                                                     */
/* -------------------------------------------------------------------------- */

export interface CategoryRow {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  order: number
  articleCount: number
}

const COLOR_OPTIONS = [
  { value: 'amber', label: 'Amber', className: 'bg-amber-500 text-white' },
  { value: 'red', label: 'Merah', className: 'bg-red-500 text-white' },
  { value: 'emerald', label: 'Hijau', className: 'bg-emerald-500 text-white' },
  { value: 'slate', label: 'Slate', className: 'bg-slate-500 text-white' },
  { value: 'zinc', label: 'Zinc', className: 'bg-zinc-500 text-white' },
  { value: 'violet', label: 'Violet', className: 'bg-violet-500 text-white' },
  { value: 'rose', label: 'Rose', className: 'bg-rose-500 text-white' },
  { value: 'cyan', label: 'Cyan', className: 'bg-cyan-500 text-white' },
] as const

/* -------------------------------------------------------------------------- */
/*  Form (mounts only when dialog open → fresh state per open)               */
/* -------------------------------------------------------------------------- */

interface CategoryFormProps {
  mode: 'create' | 'edit'
  category?: CategoryRow
  onClose: () => void
}

function CategoryForm({ mode, category, onClose }: CategoryFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(mode === 'edit' && category ? category.name : '')
  const [slug, setSlug] = useState(
    mode === 'edit' && category ? category.slug : '',
  )
  const [slugTouched, setSlugTouched] = useState(mode === 'edit')
  const [description, setDescription] = useState(
    mode === 'edit' && category ? category.description ?? '' : '',
  )
  const [color, setColor] = useState<string>(
    mode === 'edit' && category ? category.color || 'amber' : 'amber',
  )
  const [order, setOrder] = useState<string>(
    mode === 'edit' && category ? String(category.order ?? 0) : '0',
  )

  function handleNameChange(v: string) {
    setName(v)
    if (!slugTouched) {
      setSlug(slugify(v))
    }
  }

  function handleSlugChange(v: string) {
    setSlugTouched(true)
    setSlug(slugify(v))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isPending) return
    if (!name.trim() || name.trim().length < 2) {
      toast.error('Nama kategori wajib minimal 2 karakter.')
      return
    }

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      color,
      order: parseInt(order, 10) || 0,
    }

    startTransition(async () => {
      try {
        const url =
          mode === 'create'
            ? '/api/admin/categories'
            : `/api/admin/categories/${category!.id}`
        const method = mode === 'create' ? 'POST' : 'PUT'
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          toast.error(data.message || 'Gagal menyimpan kategori.')
          return
        }
        toast.success(mode === 'create' ? 'Kategori ditambahkan.' : 'Kategori diperbarui.')
        onClose()
        router.refresh()
      } catch (err) {
        console.error('[category-dialog] submit error:', err)
        toast.error('Terjadi kesalahan jaringan. Coba lagi.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="cat-name">
          Nama <span className="text-destructive">*</span>
        </Label>
        <Input
          id="cat-name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="contoh: Peredam Mobil"
          required
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="cat-slug">Slug</Label>
        <Input
          id="cat-slug"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder="auto-dari-nama"
        />
        <p className="text-xs text-muted-foreground">
          Otomatis dari nama. Bisa diedit manual — akan dinormalisasi.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="cat-desc">Deskripsi</Label>
        <Textarea
          id="cat-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Deskripsi singkat kategori (opsional)"
          rows={3}
          maxLength={280}
        />
        <p className="text-right text-[11px] text-muted-foreground">
          {description.length}/280
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cat-color">Warna Badge</Label>
          <Select value={color} onValueChange={setColor}>
            <SelectTrigger id="cat-color" className="w-full">
              <SelectValue placeholder="Pilih warna" />
            </SelectTrigger>
            <SelectContent>
              {COLOR_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  <span className="flex items-center gap-2">
                    <span
                      className={`inline-block h-3 w-3 rounded-full ${c.className}`}
                      aria-hidden
                    />
                    {c.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="cat-order">Urutan</Label>
          <Input
            id="cat-order"
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            min={0}
            step={1}
          />
        </div>
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
          ) : mode === 'create' ? (
            <>
              <Plus className="h-4 w-4" />
              Tambah
            </>
          ) : (
            'Simpan Perubahan'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

/* -------------------------------------------------------------------------- */
/*  Dialog component                                                          */
/* -------------------------------------------------------------------------- */

interface CategoryDialogProps {
  mode: 'create' | 'edit'
  category?: CategoryRow
  trigger?: React.ReactNode
}

export function CategoryDialog({ mode, category, trigger }: CategoryDialogProps) {
  const [open, setOpen] = useState(false)

  const title = mode === 'create' ? 'Tambah Kategori Baru' : 'Edit Kategori'
  const descriptionText =
    mode === 'create'
      ? 'Kategori digunakan untuk mengelompokkan artikel portal.'
      : 'Perbarui informasi kategori artikel.'

  const defaultTrigger =
    mode === 'create' ? (
      <Button className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700">
        <Plus className="h-4 w-4" />
        Kategori Baru
      </Button>
    ) : (
      <Button size="sm" variant="ghost">
        <Pencil className="h-4 w-4" />
        Edit
      </Button>
    )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>

        {open && (
          <CategoryForm mode={mode} category={category} onClose={() => setOpen(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}
