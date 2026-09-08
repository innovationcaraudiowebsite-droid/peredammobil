'use client'

import { useState, useRef, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Save,
  Loader2,
  Upload,
  Link as LinkIcon,
  Trash2,
  Image as ImageIcon,
  Building2,
  Mail,
  Share2,
  UserCircle2,
  Newspaper,
  Copyright,
  FileImage,
  BarChart3,
  ShieldCheck,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/* -------------------------------------------------------------------------- */
/*  Types & constants                                                          */
/* -------------------------------------------------------------------------- */

export interface SiteSettingData {
  siteName: string
  tagline: string
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  contactEmail: string
  contactAddress: string
  contactPhone: string | null
  socialFacebook: string | null
  socialInstagram: string | null
  socialYoutube: string | null
  authorName: string
  newsletterHeadline: string
  newsletterSubtext: string
  footerCopyright: string
  // SEO integrations
  gaMeasurementId: string | null
  gtmId: string | null
  verificationGoogle: string | null
  verificationBing: string | null
}

const COLOR_OPTIONS: { value: string; label: string; swatch: string }[] = [
  { value: 'amber', label: 'Amber', swatch: 'bg-amber-500' },
  { value: 'red', label: 'Red', swatch: 'bg-red-500' },
  { value: 'emerald', label: 'Emerald', swatch: 'bg-emerald-500' },
  { value: 'slate', label: 'Slate', swatch: 'bg-slate-500' },
  { value: 'zinc', label: 'Zinc', swatch: 'bg-zinc-500' },
  { value: 'violet', label: 'Violet', swatch: 'bg-violet-500' },
  { value: 'rose', label: 'Rose', swatch: 'bg-rose-500' },
  { value: 'cyan', label: 'Cyan', swatch: 'bg-cyan-500' },
]

/* -------------------------------------------------------------------------- */
/*  Field components                                                           */
/* -------------------------------------------------------------------------- */

function FieldRow({
  id,
  label,
  hint,
  children,
  required,
}: {
  id: string
  label: string
  hint?: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Image field (logo or favicon)                                              */
/* -------------------------------------------------------------------------- */

interface ImageFieldProps {
  id: string
  label: string
  value: string | null
  /** Upload endpoint: /api/admin/upload-logo or /api/admin/upload-favicon. */
  endpoint: string
  /** Hint about required dimensions. */
  dimensionHint: string
  /** Size class for preview. */
  previewClassName: string
  onChange: (url: string | null) => void
}

function ImageField({
  id,
  label,
  value,
  endpoint,
  dimensionHint,
  previewClassName,
  onChange,
}: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'upload' | 'url'>(value ? 'url' : 'upload')
  const [urlDraft, setUrlDraft] = useState(value ?? '')
  const [uploading, setUploading] = useState(false)

  async function handleUpload(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar.')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 4 MB.')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(endpoint, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.message || 'Gagal upload')
      }
      onChange(data.url)
      toast.success(`${label} berhasil diunggah.`)
    } catch (e) {
      toast.error('Upload gagal', {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function applyUrl() {
    const v = urlDraft.trim()
    if (!v) {
      onChange(null)
      toast.message(`${label} dihapus.`)
      return
    }
    onChange(v)
    toast.success(`${label} diperbarui.`)
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>

      {/* Mode switch */}
      <div className="flex w-fit gap-1 rounded-md border bg-muted/40 p-1 text-xs">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={cn(
            'inline-flex items-center gap-1 rounded px-2 py-1 font-medium transition-colors',
            mode === 'upload'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={cn(
            'inline-flex items-center gap-1 rounded px-2 py-1 font-medium transition-colors',
            mode === 'url'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <LinkIcon className="h-3.5 w-3.5" />
          URL
        </button>
      </div>

      {mode === 'upload' ? (
        <div className="flex flex-wrap items-center gap-3">
          {/* Preview / placeholder */}
          <div
            className={cn(
              'flex items-center justify-center overflow-hidden border bg-muted/40',
              previewClassName,
            )}
          >
            {value ? (
              <img src={value} alt={label} className="h-full w-full object-contain" />
            ) : (
              <ImageIcon className="h-5 w-5 text-muted-foreground" aria-hidden />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Mengunggah...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Pilih File
                </>
              )}
            </Button>
            {value && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-destructive hover:text-destructive"
                onClick={() => {
                  onChange(null)
                  setUrlDraft('')
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus
              </Button>
            )}
            <p className="text-xs text-muted-foreground">{dimensionHint}</p>
          </div>
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleUpload(f)
            }}
            aria-label={`${label} upload`}
          />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id={id}
            type="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://..."
            className="max-w-md"
          />
          <Button type="button" size="sm" variant="outline" onClick={applyUrl}>
            Terapkan URL
          </Button>
          {value && (
            <span className="text-xs text-muted-foreground" title={value}>
              Saat ini: {value.length > 40 ? `${value.slice(0, 40)}…` : value}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Section component                                                          */
/* -------------------------------------------------------------------------- */

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400"
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex flex-col gap-0.5">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-2">{children}</CardContent>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main form                                                                  */
/* -------------------------------------------------------------------------- */

interface SettingsFormProps {
  initial: SiteSettingData
}

export function SettingsForm({ initial }: SettingsFormProps) {
  const [form, setForm] = useState<SiteSettingData>(initial)
  const [isSaving, startTransition] = useTransition()
  const isDirty = JSON.stringify(form) !== JSON.stringify(initial)

  function patch<K extends keyof SiteSettingData>(key: K, val: SiteSettingData[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isSaving) return

    // Validate siteName (only explicit client-side check; server also enforces)
    if (!form.siteName.trim()) {
      toast.error('Nama situs wajib diisi.')
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          toast.error(data.message || 'Gagal menyimpan pengaturan.')
          return
        }
        toast.success('Pengaturan situs berhasil disimpan.')
        // Update "initial" baseline to current form so dirty flag clears
        setForm((prev) => ({ ...prev }))
        // Force the next render to compare against latest form snapshot
        // Note: parent server component will re-fetch on refresh, but for SPA feel
        // we keep current form (already in DB).
      } catch {
        toast.error('Kesalahan jaringan. Coba lagi.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Branding */}
      <SectionCard
        title="Branding"
        description="Identitas visual portal — nama, tagline, logo, favicon, dan warna utama."
        icon={Building2}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FieldRow
            id="siteName"
            label="Nama Situs"
            required
            hint="Tampil di header, footer, dan title browser."
          >
            <Input
              id="siteName"
              value={form.siteName}
              onChange={(e) => patch('siteName', e.target.value)}
              maxLength={120}
              placeholder="Peredam Mobil Jakarta"
            />
          </FieldRow>
          <FieldRow
            id="tagline"
            label="Tagline"
            hint="Slogan singkat (max 240 char)."
          >
            <Input
              id="tagline"
              value={form.tagline}
              onChange={(e) => patch('tagline', e.target.value)}
              maxLength={240}
              placeholder="Review Workshop Peredam & Upgrade Audio Terbaik"
            />
          </FieldRow>
        </div>

        <ImageField
          id="logoUrl"
          label="Logo"
          value={form.logoUrl}
          endpoint="/api/admin/upload-logo"
          dimensionHint="Otomatis di-resize 512×512 PNG (preserve transparency)."
          previewClassName="h-16 w-16 rounded-md"
          onChange={(url) => patch('logoUrl', url)}
        />

        <ImageField
          id="faviconUrl"
          label="Favicon"
          value={form.faviconUrl}
          endpoint="/api/admin/upload-favicon"
          dimensionHint="Otomatis di-resize 64×64 PNG."
          previewClassName="h-10 w-10 rounded"
          onChange={(url) => patch('faviconUrl', url)}
        />

        <FieldRow
          id="primaryColor"
          label="Warna Utama"
          hint="Warna aksen tema portal (badge, button, link)."
        >
          <Select
            value={form.primaryColor}
            onValueChange={(v) => patch('primaryColor', v)}
          >
            <SelectTrigger id="primaryColor" className="w-full sm:w-60">
              <SelectValue placeholder="Pilih warna" />
            </SelectTrigger>
            <SelectContent>
              {COLOR_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  <span className="flex items-center gap-2">
                    <span
                      className={cn('inline-block h-3 w-3 rounded-full', c.swatch)}
                      aria-hidden
                    />
                    {c.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>
      </SectionCard>

      {/* Kontak */}
      <SectionCard
        title="Kontak"
        description="Informasi kontak yang ditampilkan di footer & halaman kontak."
        icon={Mail}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FieldRow id="contactEmail" label="Email Kontak">
            <Input
              id="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={(e) => patch('contactEmail', e.target.value)}
              maxLength={200}
              placeholder="innovationcaraudio@gmail.com"
            />
          </FieldRow>
          <FieldRow id="contactPhone" label="Telepon / WhatsApp" hint="Opsional.">
            <Input
              id="contactPhone"
              value={form.contactPhone ?? ''}
              onChange={(e) => patch('contactPhone', e.target.value || null)}
              maxLength={50}
              placeholder="+62 812-3456-7890"
            />
          </FieldRow>
        </div>
        <FieldRow id="contactAddress" label="Alamat">
          <Textarea
            id="contactAddress"
            value={form.contactAddress}
            onChange={(e) => patch('contactAddress', e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Jl. Taman Surya Boulevard 3 Blok H1 No.9, Pegadungan, Kalideres, Jakarta Barat 11830"
          />
        </FieldRow>
      </SectionCard>

      {/* Social Media */}
      <SectionCard
        title="Social Media"
        description="URL akun media sosial untuk ikon di footer."
        icon={Share2}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FieldRow id="socialFacebook" label="Facebook URL" hint="Opsional.">
            <Input
              id="socialFacebook"
              type="url"
              value={form.socialFacebook ?? ''}
              onChange={(e) => patch('socialFacebook', e.target.value || null)}
              maxLength={300}
              placeholder="https://facebook.com/..."
            />
          </FieldRow>
          <FieldRow id="socialInstagram" label="Instagram URL" hint="Opsional.">
            <Input
              id="socialInstagram"
              type="url"
              value={form.socialInstagram ?? ''}
              onChange={(e) => patch('socialInstagram', e.target.value || null)}
              maxLength={300}
              placeholder="https://instagram.com/..."
            />
          </FieldRow>
          <FieldRow id="socialYoutube" label="YouTube URL" hint="Opsional.">
            <Input
              id="socialYoutube"
              type="url"
              value={form.socialYoutube ?? ''}
              onChange={(e) => patch('socialYoutube', e.target.value || null)}
              maxLength={300}
              placeholder="https://youtube.com/@..."
            />
          </FieldRow>
        </div>
      </SectionCard>

      {/* Author & Newsletter */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="Default Author"
          description="Nama author default untuk artikel baru."
          icon={UserCircle2}
        >
          <FieldRow
            id="authorName"
            label="Nama Author"
            hint="Dipakai sebagai default saat membuat artikel baru."
          >
            <Input
              id="authorName"
              value={form.authorName}
              onChange={(e) => patch('authorName', e.target.value)}
              maxLength={120}
              placeholder="Innovation Car Audio"
            />
          </FieldRow>
        </SectionCard>

        <SectionCard
          title="Newsletter"
          description="Headline & subteks untuk blok newsletter di front-end."
          icon={Newspaper}
        >
          <FieldRow id="newsletterHeadline" label="Headline">
            <Input
              id="newsletterHeadline"
              value={form.newsletterHeadline}
              onChange={(e) => patch('newsletterHeadline', e.target.value)}
              maxLength={120}
              placeholder="Buletin Mingguan"
            />
          </FieldRow>
          <FieldRow id="newsletterSubtext" label="Subteks">
            <Textarea
              id="newsletterSubtext"
              value={form.newsletterSubtext}
              onChange={(e) => patch('newsletterSubtext', e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Ringkasan review workshop dan panduan peredam, sekali seminggu."
            />
          </FieldRow>
        </SectionCard>
      </div>

      {/* Footer */}
      <SectionCard
        title="Footer"
        description="Teks copyright di bagian footer portal."
        icon={Copyright}
      >
        <FieldRow id="footerCopyright" label="Teks Copyright">
          <Textarea
            id="footerCopyright"
            value={form.footerCopyright}
            onChange={(e) => patch('footerCopyright', e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="© 2026 Peredam Mobil Jakarta. Seluruh hak cipta dilindungi."
          />
        </FieldRow>
      </SectionCard>

      {/* SEO Integrations */}
      <SectionCard
        title="SEO & Analytics"
        description="Google Analytics 4, Google Tag Manager, dan meta verifikasi Search Console. Di-apply ke seluruh halaman portal."
        icon={BarChart3}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FieldRow
            id="gaMeasurementId"
            label="GA4 Measurement ID"
            hint="Format: G-XXXXXXXXXX. Akan inject gtag.js otomatis."
          >
            <Input
              id="gaMeasurementId"
              value={form.gaMeasurementId ?? ''}
              onChange={(e) => patch('gaMeasurementId', e.target.value || null)}
              maxLength={60}
              placeholder="G-XXXXXXXXXX"
            />
          </FieldRow>
          <FieldRow
            id="gtmId"
            label="Google Tag Manager ID"
            hint="Format: GTM-XXXXXXX. Opsional."
          >
            <Input
              id="gtmId"
              value={form.gtmId ?? ''}
              onChange={(e) => patch('gtmId', e.target.value || null)}
              maxLength={60}
              placeholder="GTM-XXXXXXX"
            />
          </FieldRow>
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
          Tip: Setelah menyimpan, meta verifikasi &amp; script GA4 / GTM langsung aktif di
          semua halaman publik. Tidak perlu restart server.
        </div>
      </SectionCard>

      {/* Search Console Verification */}
      <SectionCard
        title="Verifikasi Search Console"
        description="Meta tag verifikasi untuk Google Search Console & Bing Webmaster Tools. Disisipkan ke <head> seluruh halaman."
        icon={ShieldCheck}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FieldRow
            id="verificationGoogle"
            label="google-site-verification"
            hint="Isi nilai content dari meta tag Google Search Console."
          >
            <Input
              id="verificationGoogle"
              value={form.verificationGoogle ?? ''}
              onChange={(e) => patch('verificationGoogle', e.target.value || null)}
              maxLength={200}
              placeholder="abcDEF123456..."
            />
          </FieldRow>
          <FieldRow
            id="verificationBing"
            label="msvalidate.01 (Bing)"
            hint="Isi nilai content dari meta tag Bing Webmaster."
          >
            <Input
              id="verificationBing"
              value={form.verificationBing ?? ''}
              onChange={(e) => patch('verificationBing', e.target.value || null)}
              maxLength={200}
              placeholder="Bing verification token..."
            />
          </FieldRow>
        </div>
      </SectionCard>

      {/* Submit bar (sticky bottom of form) */}
      <div className="sticky bottom-4 z-10 flex items-center justify-between rounded-lg border bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileImage className="h-4 w-4" aria-hidden />
          {isDirty ? 'Ada perubahan yang belum disimpan.' : 'Semua perubahan tersimpan.'}
        </div>
        <Button
          type="submit"
          disabled={isSaving || !isDirty}
          className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Simpan Perubahan
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
