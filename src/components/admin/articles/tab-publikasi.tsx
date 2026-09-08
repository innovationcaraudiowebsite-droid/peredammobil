'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  CalendarIcon,
  Clock,
  ExternalLink,
  History,
  Loader2,
  RotateCcw,
  Star,
  Sparkles,
  Plus,
} from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export interface VersionInfo {
  id: string
  versionNumber: number
  title: string
  excerpt: string | null
  editedBy: string
  editNote: string | null
  createdAt: string
}

interface TabPublikasiProps {
  /** Article ID (untuk preview link + version history). Null di mode new. */
  articleId: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  publishedAt: string | null
  isFeatured: boolean
  isBreaking: boolean
  featuredCount: number
  onChange: (patch: {
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
    publishedAt?: string | null
    isFeatured?: boolean
    isBreaking?: boolean
  }) => void
  /** Versi yang sudah ada (diisi hanya di mode edit). */
  versions: VersionInfo[]
  /** Refresh data setelah restore / create version. */
  onVersionsChange: () => void
}

/* -------------------------------------------------------------------------- */

function StatusRadio({
  value,
  onChange,
}: {
  value: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  onChange: (v: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => void
}) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')}
      className="grid grid-cols-1 gap-2 sm:grid-cols-3"
    >
      {[
        {
          v: 'DRAFT' as const,
          label: 'Draft',
          desc: 'Disimpan, tidak tampil di front-end',
          color: 'border-slate-300 bg-slate-50 text-slate-700 dark:bg-slate-800/40 dark:text-slate-200',
        },
        {
          v: 'PUBLISHED' as const,
          label: 'Publish',
          desc: 'Langsung tampil di portal',
          color: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
        },
        {
          v: 'ARCHIVED' as const,
          label: 'Archive',
          desc: 'Disembunyikan dari portal',
          color: 'border-zinc-300 bg-zinc-50 text-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-200',
        },
      ].map((opt) => (
        <label
          key={opt.v}
          htmlFor={`status-${opt.v}`}
          className={cn(
            'flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition-colors',
            value === opt.v ? 'border-amber-500 ring-1 ring-amber-500' : 'hover:bg-muted/40',
          )}
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value={opt.v} id={`status-${opt.v}`} />
            <span className="font-medium">{opt.label}</span>
            {value === opt.v && (
              <Badge
                variant="outline"
                className={cn('ml-auto text-[10px]', opt.color)}
              >
                Aktif
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{opt.desc}</span>
        </label>
      ))}
    </RadioGroup>
  )
}

/* -------------------------------------------------------------------------- */

function ScheduleSection({
  publishedAt,
  onChange,
}: {
  publishedAt: string | null
  onChange: (iso: string | null) => void
}) {
  const scheduled = publishedAt ? new Date(publishedAt) : null
  const isFuture = scheduled ? scheduled.getTime() > Date.now() : false
  const [enabled, setEnabled] = useState<boolean>(!!scheduled && isFuture)

  useEffect(() => {
    // sync bila publishedAt berubah external
    const sch = publishedAt ? new Date(publishedAt) : null
    setEnabled(!!sch && sch.getTime() > Date.now())
  }, [publishedAt])

  // Build local datetime string untuk input
  const initialDt = useMemo(() => {
    if (!scheduled) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${scheduled.getFullYear()}-${pad(scheduled.getMonth() + 1)}-${pad(scheduled.getDate())}T${pad(scheduled.getHours())}:${pad(scheduled.getMinutes())}`
  }, [scheduled])

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-start gap-2">
        <Checkbox
          id="schedule"
          checked={enabled}
          onCheckedChange={(v) => {
            const en = v === true
            setEnabled(en)
            if (!en) {
              // bila disable, clear publishedAt supaya publish langsung terjadi saat save
              // (kecuali user re-set via input)
            } else if (!scheduled) {
              // bila enable & belum ada tanggal, default ke +1 jam
              onChange(new Date(Date.now() + 60 * 60 * 1000).toISOString())
            }
          }}
        />
        <div className="flex flex-col">
          <Label htmlFor="schedule" className="cursor-pointer">
            Jadwalkan untuk waktu mendatang
          </Label>
          <p className="text-xs text-muted-foreground">
            Artikel akan terbit otomatis pada waktu yang dipilih (WIB / Asia/Jakarta).
          </p>
        </div>
      </div>
      {enabled && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start text-left sm:w-auto"
              >
                <CalendarIcon className="h-4 w-4" />
                {scheduled ? format(scheduled, 'd MMM yyyy', { locale: localeId }) : 'Pilih tanggal'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={scheduled ?? undefined}
                onSelect={(d) => {
                  if (!d) return
                  // Preserve time bila sudah ada
                  const base = scheduled ?? new Date()
                  d.setHours(base.getHours(), base.getMinutes(), 0, 0)
                  onChange(d.toISOString())
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Input
            type="time"
            value={scheduled ? format(scheduled, 'HH:mm') : '09:00'}
            onChange={(e) => {
              const [hh, mm] = e.target.value.split(':').map(Number)
              const base = scheduled ?? new Date()
              const d = new Date(base)
              d.setHours(hh || 9, mm || 0, 0, 0)
              onChange(d.toISOString())
            }}
            className="sm:w-32"
            aria-label="Jam terbit"
          />
          <Input
            type="datetime-local"
            value={initialDt}
            onChange={(e) => {
              const v = e.target.value
              if (!v) {
                onChange(null)
                return
              }
              const d = new Date(v)
              if (!Number.isNaN(d.getTime())) onChange(d.toISOString())
            }}
            className="flex-1"
            aria-label="Tanggal & jam terbit"
          />
          {scheduled && isFuture && (
            <Badge
              variant="outline"
              className="border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700"
            >
              <Clock className="h-3 w-3" />
              Terjadwal
            </Badge>
          )}
        </div>
      )}
      {scheduled && !isFuture && (
        <p className="text-xs text-muted-foreground">
          Waktu terbit: {format(scheduled, 'd MMM yyyy HH:mm', { locale: localeId })} WIB.
        </p>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function HighlightSection({
  isFeatured,
  isBreaking,
  featuredCount,
  onChange,
}: {
  isFeatured: boolean
  isBreaking: boolean
  featuredCount: number
  onChange: (patch: { isFeatured?: boolean; isBreaking?: boolean }) => void
}) {
  return (
    <div className="space-y-3">
      <Label>Highlight</Label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label
          htmlFor="featured"
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
            isFeatured
              ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
              : 'hover:bg-muted/40',
          )}
        >
          <Checkbox
            id="featured"
            checked={isFeatured}
            onCheckedChange={(v) => onChange({ isFeatured: v === true })}
          />
          <div className="flex flex-1 flex-col">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Star className="h-4 w-4 text-amber-500" />
              Berita Utama
            </span>
            <p className="text-xs text-muted-foreground">
              Tampilkan sebagai featured di homepage. Maksimal 5 artikel.
            </p>
          </div>
        </label>
        <label
          htmlFor="breaking"
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
            isBreaking
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : 'hover:bg-muted/40',
          )}
        >
          <Checkbox
            id="breaking"
            checked={isBreaking}
            onCheckedChange={(v) => onChange({ isBreaking: v === true })}
          />
          <div className="flex flex-1 flex-col">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-red-500" />
              Breaking News
            </span>
            <p className="text-xs text-muted-foreground">
              Tampilkan di ticker breaking news bagian atas portal.
            </p>
          </div>
        </label>
      </div>
      {isFeatured && featuredCount >= 5 && (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
          Perhatian: Sudah ada {featuredCount} artikel featured. Pertimbangkan melepas
          salah satu untuk menjaga keragaman berita utama.
        </p>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function VersionHistory({
  articleId,
  versions,
  onChange,
}: {
  articleId: string
  versions: VersionInfo[]
  onChange: () => void
}) {
  const [pending, setPending] = useState<string | null>(null) // 'create' | versionId
  const [confirmRestore, setConfirmRestore] = useState<VersionInfo | null>(null)
  const [editNote, setEditNote] = useState('')

  async function createVersion() {
    setPending('create')
    try {
      const res = await fetch(`/api/admin/articles/${articleId}/version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editNote: editNote || 'Snapshot manual' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Gagal simpan versi')
      }
      toast.success('Versi baru disimpan')
      setEditNote('')
      onChange()
    } catch (e) {
      toast.error('Gagal simpan versi', {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setPending(null)
    }
  }

  async function restore(v: VersionInfo) {
    setPending(v.id)
    try {
      const res = await fetch(`/api/admin/articles/${articleId}/restore-version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: v.id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Gagal restore')
      }
      toast.success(`Restore dari v${v.versionNumber} berhasil`)
      setConfirmRestore(null)
      onChange()
    } catch (e) {
      toast.error('Gagal restore', {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5">
          <History className="h-4 w-4" />
          Versi &amp; Riwayat
        </Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={createVersion}
          disabled={pending === 'create'}
        >
          {pending === 'create' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Simpan Versi Baru
        </Button>
      </div>

      <div className="space-y-2">
        <Input
          type="text"
          value={editNote}
          onChange={(e) => setEditNote(e.target.value)}
          placeholder="Catatan untuk snapshot baru (opsional)..."
        />
        <p className="text-xs text-muted-foreground">
          Catatan: konten yang disimpan adalah kondisi terbaru artikel (bukan input manual).
        </p>
      </div>

      {versions.length === 0 ? (
        <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          Belum ada versi tersimpan. Snapshot otomatis dibuat saat artikel di-publish
          atau saat tombol &ldquo;Simpan Versi Baru&rdquo; diklik.
        </p>
      ) : (
        <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
          {versions.map((v) => (
            <li
              key={v.id}
              className="flex items-start gap-2 rounded-md border bg-card p-2.5 text-xs"
            >
              <Badge
                variant="outline"
                className="border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700"
              >
                v{v.versionNumber}
              </Badge>
              <div className="flex-1">
                <p className="font-medium text-foreground line-clamp-1">{v.title}</p>
                <p className="text-muted-foreground">
                  {format(new Date(v.createdAt), 'd MMM yyyy HH:mm', { locale: localeId })}{' '}
                  &middot; edited by {v.editedBy}
                </p>
                {v.editNote && (
                  <p className="text-muted-foreground italic line-clamp-1">&ldquo;{v.editNote}&rdquo;</p>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 shrink-0"
                onClick={() => setConfirmRestore(v)}
                disabled={pending === v.id}
                title="Restore ke versi ini"
              >
                {pending === v.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                Restore
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={!!confirmRestore} onOpenChange={() => setConfirmRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Restore ke v{confirmRestore?.versionNumber}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Artikel akan dipulihkan ke kondisi versi ini. Sebuah snapshot baru akan
              dibuat untuk mencatat aksi restore. Judul dan konten saat ini akan
              ditimpa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending !== null}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending !== null}
              onClick={() => confirmRestore && restore(confirmRestore)}
            >
              Ya, restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

export function TabPublikasi({
  articleId,
  status,
  publishedAt,
  isFeatured,
  isBreaking,
  featuredCount,
  onChange,
  versions,
  onVersionsChange,
}: TabPublikasiProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Status Publikasi</Label>
        <StatusRadio
          value={status}
          onChange={(v) => onChange({ status: v })}
        />
      </div>

      <ScheduleSection
        publishedAt={publishedAt}
        onChange={(iso) => onChange({ publishedAt: iso })}
      />

      <HighlightSection
        isFeatured={isFeatured}
        isBreaking={isBreaking}
        featuredCount={featuredCount}
        onChange={(patch) => onChange(patch)}
      />

      {articleId && (
        <VersionHistory
          articleId={articleId}
          versions={versions}
          onChange={onVersionsChange}
        />
      )}

      {articleId && (
        <div className="space-y-2">
          <Label>Preview di front-end</Label>
          <a
            href={`/admin/articles/${articleId}/preview`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-amber-600 hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            Buka halaman preview (tab baru)
          </a>
        </div>
      )}
    </div>
  )
}
