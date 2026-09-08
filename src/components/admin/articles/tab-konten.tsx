'use client'

import { useMemo } from 'react'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArticleEditor } from './article-editor'
import { ImageUpload } from './image-upload'

interface TabKontenProps {
  excerpt: string
  contentMarkdown: string
  featuredImageUrl: string | null
  featuredImageAlt: string
  onChange: (patch: {
    excerpt?: string
    contentMarkdown?: string
    featuredImageUrl?: string | null
    featuredImageAlt?: string
  }) => void
}

const EXCERPT_MAX = 200

export function TabKonten({
  excerpt,
  contentMarkdown,
  featuredImageUrl,
  featuredImageAlt,
  onChange,
}: TabKontenProps) {
  const wordCount = useMemo(() => {
    if (!contentMarkdown) return 0
    const noFences = contentMarkdown.replace(/```[\s\S]*?```/g, ' ')
    const noHtml = noFences.replace(/<[^>]+>/g, ' ')
    const noImg = noHtml.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    const noLinks = noImg.replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    const stripped = noLinks.replace(/[#*_>~`]/g, ' ').replace(/^-+$/gm, ' ')
    return stripped.trim().split(/\s+/).filter(Boolean).length
  }, [contentMarkdown])
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  const excerptLen = excerpt?.length ?? 0
  const charColor =
    excerptLen > EXCERPT_MAX
      ? 'text-destructive'
      : excerptLen > EXCERPT_MAX - 20
        ? 'text-amber-600'
        : 'text-muted-foreground'

  return (
    <div className="space-y-6">
      {/* Excerpt */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="excerpt">Excerpt / Ringkasan</Label>
          <span className={`text-xs ${charColor}`}>
            {excerptLen}/{EXCERPT_MAX}
          </span>
        </div>
        <Textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => onChange({ excerpt: e.target.value.slice(0, EXCERPT_MAX) })}
          placeholder="Ringkasan singkat 1-2 kalimat yang akan tampil di listing artikel dan hasil pencarian."
          maxLength={EXCERPT_MAX}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Maksimal {EXCERPT_MAX} karakter. Otomatis dijadikan meta description bila tab SEO dibiarkan kosong.
        </p>
      </div>

      {/* Featured Image */}
      <div className="space-y-2">
        <ImageUpload
          value={featuredImageUrl}
          alt={featuredImageAlt}
          onChange={(url, alt) =>
            onChange({ featuredImageUrl: url, featuredImageAlt: alt })
          }
          endpoint="/api/admin/upload"
          label="Featured Image"
          hint="Drag & drop gambar ke sini, atau klik untuk pilih. Otomatis di-resize ke 1200×675 (16:9)."
        />
      </div>

      {/* Body */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="content">Body Artikel</Label>
          <span className="text-xs text-muted-foreground">
            Reading time: ~{readingTime} menit &middot; Word count: {wordCount}
          </span>
        </div>
        <ArticleEditor
          value={contentMarkdown}
          onChange={(md) => onChange({ contentMarkdown: md })}
        />
        <p className="text-xs text-muted-foreground">
          Konten disimpan sebagai markdown. Gambar yang di-upload otomatis di-embed.
        </p>
      </div>
    </div>
  )
}
