'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Loader2, Save, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export interface InitialProductData {
  id?: string
  name: string
  description: string | null
  price: string | null
  category: string
  imageUrl: string | null
  imageAlt: string | null
  waNumber: string
  sortOrder: number
  isActive: boolean
}

interface ProductFormProps {
  initial: InitialProductData | null
}

const CATEGORY_OPTIONS = [
  'Paket Layanan',
  'Material',
  'Aksesori',
  'Audio',
  'Lainnya',
]

export function ProductForm({ initial }: ProductFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState<InitialProductData>(
    initial ?? {
      name: '',
      description: '',
      price: '',
      category: 'Paket Layanan',
      imageUrl: null,
      imageAlt: '',
      waNumber: '6282211222399',
      sortOrder: 0,
      isActive: true,
    },
  )

  const patch = (p: Partial<InitialProductData>) => setForm((prev) => ({ ...prev, ...p }))

  const handleUploadImage = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload-product', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Gagal upload gambar')
      }
      const data = (await res.json()) as { ok: boolean; url?: string }
      if (!data.url) throw new Error('URL gambar tidak diterima')
      patch({ imageUrl: data.url })
      toast.success('Gambar berhasil diupload')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal upload gambar')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (publishActive: boolean) => {
    // Validasi
    if (form.name.trim().length < 3) {
      toast.error('Nama produk minimal 3 karakter')
      return
    }
    if (!form.category) {
      toast.error('Kategori wajib diisi')
      return
    }
    if (!form.waNumber.trim()) {
      toast.error('Nomor WA admin wajib diisi')
      return
    }

    setSaving(true)
    const url = form.id ? `/api/admin/products/${form.id}` : '/api/admin/products'
    const method = form.id ? 'PUT' : 'POST'
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, isActive: publishActive }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Gagal simpan produk')
      }
      const data = await res.json()
      toast.success(form.id ? 'Produk berhasil diupdate' : 'Produk berhasil dibuat')
      router.push('/admin/products')
      router.refresh()
      return data
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal simpan produk')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Back link */}
      <div className="mb-4">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Daftar Produk
        </Link>
      </div>

      <h1 className="mb-1 text-xl font-bold tracking-tight sm:text-2xl">
        {form.id ? 'Edit Produk' : 'Tambah Produk'}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Isi data produk. Produk aktif akan tampil di landing page Section 4 (Paket Layanan).
      </p>

      <div className="space-y-5">
        {/* Nama Produk */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-semibold">
            Nama Produk *
          </Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="Contoh: Paket 4 Pintu"
            className="h-11"
          />
        </div>

        {/* Kategori */}
        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-semibold">
            Kategori *
          </Label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => patch({ category: e.target.value })}
            className="flex h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Deskripsi */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-semibold">
            Deskripsi
          </Label>
          <Textarea
            id="description"
            value={form.description || ''}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="Deskripsi singkat produk..."
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {(form.description || '').length}/500 karakter
          </p>
        </div>

        {/* Harga */}
        <div className="space-y-2">
          <Label htmlFor="price" className="text-sm font-semibold">
            Harga
          </Label>
          <Input
            id="price"
            value={form.price || ''}
            onChange={(e) => patch({ price: e.target.value })}
            placeholder='Contoh: "Rp 1.500.000" atau "Hubungi Admin"'
            className="h-11"
          />
        </div>

        {/* Upload Gambar */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Gambar Produk</Label>
          <div className="flex gap-3">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
              {form.imageUrl ? (
                <>
                  <Image
                    src={form.imageUrl}
                    alt={form.imageAlt || form.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => patch({ imageUrl: null })}
                    className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    aria-label="Hapus gambar"
                  >
                    <X className="size-3" />
                  </button>
                </>
              ) : (
                <div className="grid h-full place-items-center text-[10px] text-muted-foreground">
                  No img
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUploadImage(file)
                  e.target.value = ''
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    Upload Gambar
                  </>
                )}
              </Button>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Format: JPG, PNG, WebP. Maks 8MB. Aauto-resize 800×800.
              </p>
            </div>
          </div>
        </div>

        {/* Alt text */}
        <div className="space-y-2">
          <Label htmlFor="imageAlt" className="text-sm font-semibold">
            Alt Text Gambar
          </Label>
          <Input
            id="imageAlt"
            value={form.imageAlt || ''}
            onChange={(e) => patch({ imageAlt: e.target.value })}
            placeholder="Deskripsi gambar untuk SEO & aksesibilitas"
            className="h-11"
          />
        </div>

        {/* Nomor WA Admin */}
        <div className="space-y-2">
          <Label htmlFor="waNumber" className="text-sm font-semibold">
            Nomor WA Admin (untuk CTA produk) *
          </Label>
          <Input
            id="waNumber"
            value={form.waNumber}
            onChange={(e) => patch({ waNumber: e.target.value })}
            placeholder="Contoh: 6282211222399 (format internasional, tanpa +)"
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">
            Format: 62&lt;nomor&gt; tanpa tanda + atau spasi. Contoh: 6282211222399
          </p>
        </div>

        {/* Order */}
        <div className="space-y-2">
          <Label htmlFor="sortOrder" className="text-sm font-semibold">
            Urutan Tampil
          </Label>
          <Input
            id="sortOrder"
            type="number"
            value={form.sortOrder}
            onChange={(e) => patch({ sortOrder: parseInt(e.target.value) || 0 })}
            placeholder="0"
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">
            Produk dengan order lebih kecil tampil lebih dulu.
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-8 flex gap-2">
        <Button
          type="button"
          onClick={() => handleSave(true)}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="size-4" />
              {form.id ? 'Update & Aktifkan' : 'Simpan & Aktifkan'}
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSave(false)}
          disabled={saving}
        >
          Simpan sebagai Draft
        </Button>
        <Button asChild variant="ghost">
          <Link href="/admin/products">Batal</Link>
        </Button>
      </div>
    </div>
  )
}
