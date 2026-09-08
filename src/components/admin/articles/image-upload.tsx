'use client'

import { useState, useRef, useCallback } from 'react'
import { ImagePlus, Loader2, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AspectRatio } from '@/components/ui/aspect-ratio'

interface ImageUploadProps {
  /** URL gambar yang sudah ada (misal dari DB saat edit). */
  value: string | null
  /** Alt text yang sudah ada. */
  alt: string
  onChange: (url: string | null, alt: string) => void
  /** Upload endpoint: '/api/admin/upload' untuk featured, '/api/admin/upload-inline' untuk inline. */
  endpoint?: string
  /** Label deskriptif. */
  label?: string
  /** Hint di bawah area upload. */
  hint?: string
  /** Aspect ratio untuk preview (default 16:9). */
  aspect?: number
  /** Tampilkan input alt text (default true). */
  showAlt?: boolean
  className?: string
}

/**
 * Drag-and-drop upload component untuk gambar.
 * Upload ke endpoint multipart, tampilkan preview sesuai aspect ratio,
 * input alt text untuk aksesibilitas, tombol Ganti & Hapus.
 */
export function ImageUpload({
  value,
  alt,
  onChange,
  endpoint = '/api/admin/upload',
  label = 'Featured Image',
  hint = 'Drag & drop gambar ke sini, atau klik untuk pilih. Otomatis di-resize ke 1200×675 (16:9).',
  aspect = 16 / 9,
  showAlt = true,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

  const upload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('File harus berupa gambar')
        return
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error('Ukuran gambar maksimal 8 MB')
        return
      }
      setUploading(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch(endpoint, { method: 'POST', body: fd })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.message || 'Gagal upload')
        }
        const data = (await res.json()) as { ok: boolean; url?: string }
        if (!data.url) throw new Error('URL gambar tidak diterima')
        onChange(data.url, alt)
        toast.success('Gambar berhasil diunggah')
      } catch (e) {
        toast.error('Upload gagal', {
          description: e instanceof Error ? e.message : undefined,
        })
      } finally {
        setUploading(false)
      }
    },
    [alt, endpoint, onChange],
  )

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    upload(files[0])
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-destructive hover:text-destructive"
            onClick={() => {
              onChange(null, '')
              if (inputRef.current) inputRef.current.value = ''
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus
          </Button>
        )}
      </div>

      {!value ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFiles(e.dataTransfer.files)
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-muted/30 p-8 text-center transition-colors',
            'hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            dragOver && 'border-amber-500 bg-amber-50 dark:bg-amber-900/20',
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              <p className="text-sm text-muted-foreground">Mengunggah...</p>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                <ImagePlus className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">Klik untuk pilih gambar</p>
              <p className="text-xs text-muted-foreground">atau drag & drop ke sini</p>
            </>
          )}
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-lg border">
          <AspectRatio ratio={aspect}>
            <img
              src={value}
              alt={alt || 'Featured image'}
              className="h-full w-full object-cover"
            />
          </AspectRatio>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent p-2">
            <span className="truncate text-[11px] text-white/80">{value}</span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-7"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5" />
              )}
              Ganti
            </Button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        aria-label={`Upload ${label}`}
      />

      {showAlt && (
        <div className="space-y-1.5">
          <Label htmlFor="img-alt" className="text-xs">
            Alt text (aksesibilitas &amp; SEO)
          </Label>
          <Input
            id="img-alt"
            value={alt}
            onChange={(e) => onChange(value, e.target.value)}
            placeholder="Deskripsikan gambar singkat..."
            className="text-sm"
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}
