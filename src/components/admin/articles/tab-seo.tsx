'use client'

import { Sparkles, Loader2, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ImageUpload } from './image-upload'
import { GooglePreview } from './google-preview'

interface TabSeoProps {
  /** Title artikel (untuk fallback meta title + preview). */
  title: string
  /** Slug artikel (untuk preview URL). */
  slug: string
  /** Excerpt untuk fallback meta description. */
  excerpt: string
  /** Konten markdown untuk konteks generate AI. */
  contentMarkdown: string

  metaTitle: string
  metaDescription: string
  metaKeywords: string
  ogImageUrl: string | null

  /** Featured image URL — dipakai sebagai fallback OG image. */
  featuredImageUrl: string | null

  onChange: (patch: {
    metaTitle?: string
    metaDescription?: string
    metaKeywords?: string
    ogImageUrl?: string | null
  }) => void
}

const META_TITLE_MAX = 60
const META_DESC_MAX = 160

export function TabSeo({
  title,
  slug,
  excerpt,
  contentMarkdown,
  metaTitle,
  metaDescription,
  metaKeywords,
  ogImageUrl,
  featuredImageUrl,
  onChange,
}: TabSeoProps) {
  const [generating, setGenerating] = useState(false)

  async function generateMeta() {
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/generate-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          excerpt,
          content: contentMarkdown,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Gagal generate')
      }
      const data = (await res.json()) as { ok: boolean; metaDescription?: string }
      if (!data.metaDescription) throw new Error('AI tidak mengembalikan teks')
      onChange({ metaDescription: data.metaDescription })
      toast.success('Meta description dihasilkan AI', {
        description: 'Anda bisa edit lagi bila perlu.',
      })
    } catch (e) {
      toast.error('Gagal generate meta description', {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setGenerating(false)
    }
  }

  const effectiveMetaTitle = metaTitle || title.slice(0, META_TITLE_MAX)
  const effectiveMetaDesc = metaDescription || excerpt.slice(0, META_DESC_MAX)
  const ogPreview = ogImageUrl || featuredImageUrl

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-5">
        {/* Meta Title */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="meta-title">Meta Title</Label>
            <span
              className={
                metaTitle.length > META_TITLE_MAX
                  ? 'text-xs text-destructive'
                  : 'text-xs text-muted-foreground'
              }
            >
              {metaTitle.length}/{META_TITLE_MAX}
            </span>
          </div>
          <Input
            id="meta-title"
            value={metaTitle}
            onChange={(e) => onChange({ metaTitle: e.target.value.slice(0, META_TITLE_MAX + 20) })}
            placeholder={title || 'Otomatis pakai judul artikel'}
            maxLength={META_TITLE_MAX + 20}
          />
          <p className="text-xs text-muted-foreground">
            Kosongkan untuk menggunakan judul artikel.
          </p>
        </div>

        {/* Meta Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="meta-desc">Meta Description</Label>
            <span
              className={
                metaDescription.length > META_DESC_MAX
                  ? 'text-xs text-destructive'
                  : 'text-xs text-muted-foreground'
              }
            >
              {metaDescription.length}/{META_DESC_MAX}
            </span>
          </div>
          <Textarea
            id="meta-desc"
            value={metaDescription}
            onChange={(e) =>
              onChange({ metaDescription: e.target.value.slice(0, META_DESC_MAX + 40) })
            }
            placeholder={excerpt || 'Otomatis pakai excerpt artikel'}
            rows={4}
            maxLength={META_DESC_MAX + 40}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Kosongkan untuk menggunakan excerpt.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={generateMeta}
              disabled={generating || (!title && !excerpt && !contentMarkdown)}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 text-amber-500" />
              )}
              Generate dengan AI
            </Button>
          </div>
        </div>

        {/* Meta Keywords */}
        <div className="space-y-2">
          <Label htmlFor="meta-keywords">Meta Keywords</Label>
          <Input
            id="meta-keywords"
            value={metaKeywords}
            onChange={(e) => onChange({ metaKeywords: e.target.value })}
            placeholder="peredam, mobil, jakarta (pisah koma)"
          />
          <p className="text-xs text-muted-foreground">
            Kosongkan untuk menggunakan tag artikel (otomatis).
          </p>
        </div>

        {/* OG Image */}
        <div className="space-y-2">
          <ImageUpload
            value={ogImageUrl}
            alt=""
            onChange={(url) => onChange({ ogImageUrl: url })}
            endpoint="/api/admin/upload"
            label="OG Image (opsional)"
            hint="Kosongkan untuk menggunakan featured image. Direkomendasikan 1200×630."
            showAlt={false}
          />
        </div>
      </div>

      {/* Live Google Preview */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label>Preview Google Search</Label>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <GooglePreview
          url={`peredammobiljakarta.com/berita/${slug || 'slug-artikel'}`}
          title={effectiveMetaTitle || 'Judul artikel akan tampil di sini'}
          description={effectiveMetaDesc || 'Deskripsi artikel akan tampil di sini.'}
          imageUrl={ogPreview}
        />

        {/* OG Card preview (untuk WhatsApp / Twitter) */}
        <div className="mt-4 space-y-2">
          <Label>Preview OG Card (WhatsApp / Twitter)</Label>
          <div className="overflow-hidden rounded-lg border bg-muted/30">
            {ogPreview ? (
              <img
                src={ogPreview}
                alt="OG image"
                className="aspect-[1.91/1] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[1.91/1] items-center justify-center bg-muted text-sm text-muted-foreground">
                Tanpa gambar (akan pakai featured image bila ada)
              </div>
            )}
            <div className="space-y-0.5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                peredammobiljakarta.com
              </p>
              <p className="line-clamp-1 text-sm font-semibold text-foreground">
                {effectiveMetaTitle || 'Judul artikel'}
              </p>
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {effectiveMetaDesc || 'Deskripsi artikel'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
