'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Trash2, MessageCircle, Plus, Search } from 'lucide-react'
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

interface Product {
  id: string
  name: string
  description: string | null
  price: string | null
  category: string
  imageUrl: string | null
  imageAlt: string | null
  waNumber: string
  order: number
  isActive: boolean
  createdAt: string
}

interface ProductsTableProps {
  products: Product[]
}

export function ProductsTable({ products }: ProductsTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const categories = Array.from(new Set(products.map((p) => p.category))).sort()

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase())
    const matchCategory = filterCategory === 'all' || p.category === filterCategory
    return matchSearch && matchCategory
  })

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/products/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Gagal hapus produk')
      }
      toast.success('Produk berhasil dihapus')
      setDeleteId(null)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal hapus produk')
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      })
      if (!res.ok) throw new Error('Gagal update status')
      toast.success(`Produk ${!currentActive ? 'diaktifkan' : 'dinonaktifkan'}`)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal update status')
    }
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">
          Belum ada produk. Klik tombol di atas untuk menambah produk pertama.
        </p>
        <Button asChild className="mt-4" size="sm">
          <Link href="/admin/products/new">
            <Plus className="size-4" />
            Tambah Produk
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Filter & search */}
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="all">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium">Gambar</th>
              <th className="px-3 py-2.5 text-left font-medium">Nama</th>
              <th className="px-3 py-2.5 text-left font-medium">Kategori</th>
              <th className="px-3 py-2.5 text-left font-medium">Harga</th>
              <th className="px-3 py-2.5 text-left font-medium">WA</th>
              <th className="px-3 py-2.5 text-left font-medium">Status</th>
              <th className="px-3 py-2.5 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  Tidak ada produk yang cocok dengan filter.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-3 py-2.5">
                    <div className="relative size-12 overflow-hidden rounded-md border border-border bg-muted">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.imageAlt || p.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-[10px] text-muted-foreground">
                          No img
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium">{p.name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      {p.description || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-block rounded bg-brand/15 px-2 py-0.5 text-xs font-medium text-brand">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs">{p.price || '-'}</td>
                  <td className="px-3 py-2.5 text-xs">
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <MessageCircle className="size-3" />
                      {p.waNumber}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(p.id, p.isActive)}
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                        p.isActive
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400'
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          p.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      {p.isActive ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex gap-1">
                      <Button asChild size="sm" variant="ghost" className="size-8 p-0">
                        <Link href={`/admin/products/${p.id}/edit`} title="Edit produk">
                          <Pencil className="size-3.5" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(p.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus produk?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Produk &quot;{p.name}&quot; akan dihapus permanen. Tindakan ini
                              tidak bisa dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteId(null)}>
                              Batal
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDelete}
                              disabled={deleting}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deleting ? 'Menghapus...' : 'Hapus'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Menampilkan {filtered.length} dari {products.length} produk
      </p>
    </>
  )
}
