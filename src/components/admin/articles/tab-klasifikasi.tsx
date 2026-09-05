'use client'

import { useState, useMemo } from 'react'
import { Plus, X, Tags as TagsIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface TagOption {
  id: string
  name: string
  slug: string
}

interface CategoryOption {
  id: string
  name: string
  slug: string
  color: string | null
  description?: string | null
}

interface TabKlasifikasiProps {
  categories: CategoryOption[]
  tags: TagOption[]
  selectedCategoryId: string | null
  selectedTagIds: string[]
  onChange: (patch: {
    categoryId?: string | null
    tagIds?: string[]
  }) => void
}

function categoryBadgeClass(color: string | null | undefined): string {
  switch (color) {
    case 'amber':
      return 'border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700'
    case 'red':
      return 'border-red-300 bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700'
    case 'emerald':
      return 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700'
    case 'slate':
      return 'border-slate-300 bg-slate-50 text-slate-800 dark:bg-slate-700/40 dark:text-slate-100 dark:border-slate-600'
    default:
      return 'border-border bg-muted text-foreground'
  }
}

export function TabKlasifikasi({
  categories,
  tags,
  selectedCategoryId,
  selectedTagIds,
  onChange,
}: TabKlasifikasiProps) {
  const [tagInput, setTagInput] = useState('')

  const selectedTagObjs = useMemo(
    () => tags.filter((t) => selectedTagIds.includes(t.id)),
    [tags, selectedTagIds],
  )

  function addTag(tag: TagOption) {
    if (selectedTagIds.includes(tag.id)) return
    onChange({ tagIds: [...selectedTagIds, tag.id] })
  }

  function removeTag(id: string) {
    onChange({ tagIds: selectedTagIds.filter((t) => t !== id) })
  }

  function handleTagInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const raw = tagInput.trim()
    if (!raw) return
    // cari existing tag berdasarkan slug (case-insensitive name match)
    const slugMatch = tags.find(
      (t) => t.name.toLowerCase() === raw.toLowerCase() || t.slug === raw.toLowerCase().replace(/\s+/g, '-'),
    )
    if (slugMatch) {
      addTag(slugMatch)
    } else {
      // tag baru — buat via API (atau anggap slug dibuat otomatis di server saat save)
      // Untuk UX yang simple, simpan sementara sebagai "-new:<name>" lalu saat save
      // server akan upsert tag dan connect. Untuk sekarang, kita buat via /api/admin/tags (jika ada)
      // atau append sebagai pseudo-tag.
      // Pendekatan sederhana: pakai ID = `new:${raw}` lalu server-side translate.
      const pseudoId = `new:${raw}`
      if (!selectedTagIds.includes(pseudoId)) {
        onChange({ tagIds: [...selectedTagIds, pseudoId] })
      }
    }
    setTagInput('')
  }

  function addSuggestion(tag: TagOption) {
    addTag(tag)
  }

  // Filter suggestions untuk click-to-add
  const suggestions = useMemo(
    () => tags.filter((t) => !selectedTagIds.includes(t.id)).slice(0, 12),
    [tags, selectedTagIds],
  )

  return (
    <div className="space-y-6">
      {/* Kategori */}
      <div className="space-y-3">
        <Label>Kategori</Label>
        <p className="text-xs text-muted-foreground">
          Pilih satu kategori. Wajib diisi.
        </p>
        <RadioGroup
          value={selectedCategoryId ?? ''}
          onValueChange={(v) => onChange({ categoryId: v })}
          className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
          {categories.map((c) => (
            <label
              key={c.id}
              htmlFor={`cat-${c.id}`}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40',
                selectedCategoryId === c.id && 'border-amber-500 bg-amber-50 dark:bg-amber-900/20',
              )}
            >
              <RadioGroupItem value={c.id} id={`cat-${c.id}`} className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  <span
                    className={cn(
                      'inline-block rounded border px-1.5 py-0.5 text-[10px] uppercase',
                      categoryBadgeClass(c.color),
                    )}
                  >
                    {c.color ?? 'default'}
                  </span>
                </div>
                {c.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {c.description}
                  </p>
                )}
              </div>
            </label>
          ))}
        </RadioGroup>
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Belum ada kategori. Tambahkan kategori terlebih dahulu di halaman Kategori.
          </p>
        )}
      </div>

      {/* Tag */}
      <div className="space-y-3">
        <Label>Tag</Label>
        <p className="text-xs text-muted-foreground">
          Ketik nama tag lalu Enter untuk menambah. Tag baru akan dibuat otomatis saat simpan.
        </p>
        <div className="flex gap-2">
          <Input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            placeholder="Cth: butyl, dsp, speaker split..."
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (!tagInput.trim()) return
              const fakeEvent = {
                key: 'Enter',
                preventDefault: () => {},
              } as unknown as React.KeyboardEvent<HTMLInputElement>
              handleTagInputKeyDown(fakeEvent)
            }}
          >
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </div>

        {/* Selected tags */}
        {selectedTagObjs.length > 0 || selectedTagIds.some((id) => id.startsWith('new:')) ? (
          <div className="flex flex-wrap gap-1.5">
            {selectedTagIds.map((id) => {
              const tag = tags.find((t) => t.id === id)
              const display = tag ? tag.name : id.replace(/^new:/, '')
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-1 text-xs"
                >
                  <TagsIcon className="h-3 w-3 text-muted-foreground" />
                  {display}
                  <button
                    type="button"
                    onClick={() => removeTag(id)}
                    className="rounded-sm p-0.5 hover:bg-muted-foreground/20"
                    aria-label={`Hapus tag ${display}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Belum ada tag dipilih.</p>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Tag tersedia (klik untuk tambah):</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => addSuggestion(t)}
                  className="inline-flex items-center gap-1 rounded-md border border-dashed bg-background px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-amber-500 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-900/20"
                >
                  <Plus className="h-3 w-3" />
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
