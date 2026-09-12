'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Eye,
  Loader2,
  Save,
  Send,
  RefreshCw,
  Trash2,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { slugify } from '@/lib/slug'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
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

import { TabKonten } from './tab-konten'
import { TabKlasifikasi } from './tab-klasifikasi'
import { TabSeo } from './tab-seo'
import { TabPublikasi, type VersionInfo } from './tab-publikasi'

/* -------------------------------------------------------------------------- */

export interface InitialArticleData {
  id: string
  title: string
  slug: string
  excerpt: string
  contentMarkdown: string
  featuredImageUrl: string | null
  featuredImageAlt: string
  categoryId: string | null
  authorName: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  isFeatured: boolean
  isBreaking: boolean
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  ogImageUrl: string | null
  targetKeyword: string
  publishedAt: string | null
  tagIds: string[]
  versions: VersionInfo[]
}

export interface ArticleFormProps {
  /** null = mode new. */
  initial: InitialArticleData | null
  categories: {
    id: string
    name: string
    slug: string
    color: string | null
    description?: string | null
  }[]
  tags: { id: string; name: string; slug: string }[]
  featuredCount: number
}

/* -------------------------------------------------------------------------- */

type StatusValue = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

interface FormState {
  title: string
  slug: string
  slugTouched: boolean
  excerpt: string
  contentMarkdown: string
  featuredImageUrl: string | null
  featuredImageAlt: string
  categoryId: string | null
  authorName: string
  status: StatusValue
  isFeatured: boolean
  isBreaking: boolean
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  ogImageUrl: string | null
  targetKeyword: string
  publishedAt: string | null
  tagIds: string[]
}

function defaultState(): FormState {
  return {
    title: '',
    slug: '',
    slugTouched: false,
    excerpt: '',
    contentMarkdown: '',
    featuredImageUrl: null,
    featuredImageAlt: '',
    categoryId: null,
    authorName: 'Innovation Car Audio',
    status: 'DRAFT',
    isFeatured: false,
    isBreaking: false,
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    ogImageUrl: null,
    targetKeyword: '',
    publishedAt: null,
    tagIds: [],
  }
}

function fromInitial(i: InitialArticleData): FormState {
  return {
    title: i.title,
    slug: i.slug,
    slugTouched: true, // assume user-set
    excerpt: i.excerpt ?? '',
    contentMarkdown: i.contentMarkdown ?? '',
    featuredImageUrl: i.featuredImageUrl,
    featuredImageAlt: i.featuredImageAlt ?? '',
    categoryId: i.categoryId,
    authorName: i.authorName,
    status: i.status,
    isFeatured: i.isFeatured,
    isBreaking: i.isBreaking,
    metaTitle: i.metaTitle ?? '',
    metaDescription: i.metaDescription ?? '',
    metaKeywords: i.metaKeywords ?? '',
    ogImageUrl: i.ogImageUrl,
    targetKeyword: i.targetKeyword ?? '',
    publishedAt: i.publishedAt,
    tagIds: i.tagIds,
  }
}

/* -------------------------------------------------------------------------- */

const STATUS_DOT: Record<StatusValue, string> = {
  DRAFT: 'bg-slate-400',
  PUBLISHED: 'bg-emerald-500',
  ARCHIVED: 'bg-zinc-500',
}

const STATUS_LABEL: Record<StatusValue, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
}

/* -------------------------------------------------------------------------- */

export function ArticleForm({
  initial,
  categories,
  tags,
  featuredCount,
}: ArticleFormProps) {
  const router = useRouter()
  const isEdit = !!initial
  const [state, setState] = useState<FormState>(() =>
    initial ? fromInitial(initial) : defaultState(),
  )
  const [versions, setVersions] = useState<VersionInfo[]>(initial?.versions ?? [])
  const [activeTab, setActiveTab] = useState('konten')
  const [busy, setBusy] = useState<null | 'draft' | 'publish' | 'delete'>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(initial?.id ?? null)
  const [currentSlug, setCurrentSlug] = useState<string>(initial?.slug ?? '')

  /* ---------------------------- Patch helper ---------------------------- */
  const patch = useCallback((p: Partial<FormState>) => {
    setState((prev) => ({ ...prev, ...p }))
  }, [])

  /* ---------------------------- Slug auto-gen --------------------------- */
  // Auto-generate slug dari title bila user belum menyentuh slug manually.
  useEffect(() => {
    if (state.slugTouched) return
    const generated = slugify(state.title)
    if (generated !== state.slug) {
      patch({ slug: generated })
    }
  }, [state.title, state.slugTouched, state.slug, patch])

  function regenerateSlug() {
    const s = slugify(state.title)
    patch({ slug: s, slugTouched: true })
    toast.success('Slug di-regenerate dari judul')
  }

  function onSlugChange(v: string) {
    patch({ slug: slugify(v), slugTouched: true })
  }

  /* --------------------------- Validation ------------------------------- */
  const errors = useMemo(() => {
    const errs: string[] = []
    if (state.title.trim().length < 3)
      errs.push('Judul minimal 3 karakter.')
    if (!state.categoryId) errs.push('Kategori wajib dipilih.')
    if (state.contentMarkdown.trim().length < 50)
      errs.push('Konten minimal 50 karakter (wajib untuk publish).')
    return errs
  }, [state.title, state.categoryId, state.contentMarkdown])

  /* --------------------------- Refresh versions ------------------------- */
  async function refreshVersions() {
    if (!currentId) return
    try {
      const res = await fetch(`/api/admin/articles/${currentId}/version`)
      if (!res.ok) return
      const data = (await res.json()) as { ok: boolean; versions?: VersionInfo[] }
      if (data.versions) setVersions(data.versions)
    } catch {
      /* silent */
    }
  }

  /* --------------------------- Build payload ---------------------------- */
  function buildPayload(): Record<string, unknown> {
    return {
      title: state.title,
      slug: state.slug,
      excerpt: state.excerpt,
      contentMarkdown: state.contentMarkdown,
      featuredImageUrl: state.featuredImageUrl,
      featuredImageAlt: state.featuredImageAlt,
      categoryId: state.categoryId,
      authorName: state.authorName,
      status: state.status,
      isFeatured: state.isFeatured,
      isBreaking: state.isBreaking,
      metaTitle: state.metaTitle,
      metaDescription: state.metaDescription,
      metaKeywords: state.metaKeywords,
      ogImageUrl: state.ogImageUrl,
      targetKeyword: state.targetKeyword,
      publishedAt: state.publishedAt,
      tagIds: state.tagIds,
    }
  }

  /* --------------------------- Save handlers ---------------------------- */
  async function saveAsDraft() {
    if (state.title.trim().length < 3) {
      toast.error('Judul minimal 3 karakter sebelum bisa disimpan.')
      return
    }
    setBusy('draft')
    try {
      const payload = buildPayload()
      // Untuk save draft: status jadi DRAFT (kecuali bila sudah published — biarkan)
      // Untuk artikel baru: selalu DRAFT
      const draftStatus: StatusValue =
        !isEdit || state.status === 'PUBLISHED' ? 'DRAFT' : state.status
      const body = { ...payload, status: draftStatus }
      const url = currentId ? `/api/admin/articles/${currentId}` : '/api/admin/articles'
      const method = currentId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Gagal menyimpan')
      }
      const data = (await res.json()) as { ok: boolean; id?: string; slug?: string }
      const effectiveId = currentId ?? data.id ?? null
      if (!currentId && data.id) {
        // First save: switch ke edit mode by navigating
        setCurrentId(data.id)
        setCurrentSlug(data.slug ?? state.slug)
        toast.success('Draft disimpan', {
          description: 'Anda sekarang dalam mode edit.',
        })
        // Replace URL supaya refresh tidak membuat duplikat
        router.replace(`/admin/articles/${data.id}/edit`)
      } else {
        toast.success('Perubahan disimpan sebagai draft')
      }
      // Refresh versions menggunakan ID efektif (bukan dari state closure)
      if (effectiveId) {
        try {
          const vRes = await fetch(`/api/admin/articles/${effectiveId}/version`)
          if (vRes.ok) {
            const vData = (await vRes.json()) as { ok: boolean; versions?: VersionInfo[] }
            if (vData.versions) setVersions(vData.versions)
          }
        } catch {
          /* silent */
        }
      }
    } catch (e) {
      toast.error('Gagal menyimpan draft', {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setBusy(null)
    }
  }

  async function publish() {
    if (errors.length > 0) {
      toast.error('Tidak bisa publish', {
        description: errors[0],
      })
      setActiveTab(errors[0].includes('Kategori') ? 'klasifikasi' : 'konten')
      return
    }
    setBusy('publish')
    try {
      const payload = { ...buildPayload(), status: 'PUBLISHED' as StatusValue }
      const url = currentId ? `/api/admin/articles/${currentId}` : '/api/admin/articles'
      const method = currentId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Gagal publish')
      }
      const data = (await res.json()) as { ok: boolean; id?: string; slug?: string }
      toast.success('Artikel dipublikasikan', {
        description: 'Pembaca sudah bisa melihat artikel ini di portal.',
      })
      router.push('/admin/articles')
      router.refresh()
    } catch (e) {
      toast.error('Gagal publish', {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setBusy(null)
    }
  }

  async function archive() {
    if (!currentId) {
      toast.error('Simpan sebagai draft dulu sebelum mengarsipkan.')
      return
    }
    setBusy('draft')
    try {
      const res = await fetch(`/api/admin/articles/${currentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Gagal arsip')
      }
      patch({ status: 'ARCHIVED' })
      toast.success('Artikel diarsipkan')
    } catch (e) {
      toast.error('Gagal mengarsipkan', {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setBusy(null)
    }
  }

  async function doDelete() {
    if (!currentId) {
      // New article: just navigate away
      router.push('/admin/articles')
      return
    }
    setBusy('delete')
    try {
      const res = await fetch(`/api/admin/articles/${currentId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Gagal hapus')
      }
      toast.success('Artikel dihapus')
      router.push('/admin/articles')
      router.refresh()
    } catch (e) {
      toast.error('Gagal menghapus', {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setBusy(null)
      setConfirmDelete(false)
    }
  }

  /* --------------------------- Preview handler -------------------------- */
  const currentIdRef = useRef<string | null>(currentId)
  currentIdRef.current = currentId

  async function openPreview() {
    if (!currentId) {
      // Save as draft dulu untuk dapat ID
      await saveAsDraft()
    }
    // gunakan setTimeout supaya state update dulu (saveAsDraft set state async)
    setTimeout(() => {
      const id = currentIdRef.current
      if (id) {
        window.open(`/admin/articles/${id}/preview`, '_blank')
      } else {
        toast.error('Simpan draft dulu sebelum preview.')
      }
    }, currentId ? 0 : 600)
  }

  /* --------------------------- Render ----------------------------------- */
  return (
    <div className="flex min-h-screen flex-col pb-20">
      {/* Back link */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link
          href="/admin/articles"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Artikel
        </Link>
        <Badge
          variant="outline"
          className={cn(
            'gap-1.5',
            state.status === 'PUBLISHED' && 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
            state.status === 'DRAFT' && 'border-slate-300 bg-slate-50 text-slate-700 dark:bg-slate-800/40 dark:text-slate-200',
            state.status === 'ARCHIVED' && 'border-zinc-300 bg-zinc-50 text-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-200',
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[state.status])} />
          {STATUS_LABEL[state.status]}
        </Badge>
      </div>

      {/* Title input */}
      <div className="mb-4 space-y-2">
        <Label htmlFor="title" className="sr-only">
          Judul Artikel
        </Label>
        <Input
          id="title"
          value={state.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="Masukkan judul artikel..."
          className={`text-2xl font-bold h-14 shadow-none border-none bg-transparent focus-visible:ring-0 px-0 ${
            state.title.trim().length > 0 && state.title.trim().length < 3
              ? 'text-destructive placeholder:text-destructive/50'
              : ''
          }`}
        />
        {/* Inline validation hint */}
        {state.title.trim().length > 0 && state.title.trim().length < 3 && (
          <p className="text-xs text-destructive">
            ⚠ Judul minimal 3 karakter ({state.title.trim().length}/3)
          </p>
        )}
        {state.title.trim().length >= 3 && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            ✓ Judul valid ({state.title.trim().length} karakter)
          </p>
        )}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <span className="text-xs text-muted-foreground">
            /berita/
            {state.categoryId
              ? categories.find((c) => c.id === state.categoryId)?.slug ?? 'kategori'
              : 'kategori'}
            /
          </span>
          <Input
            type="text"
            value={state.slug}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder="slug-otomatis"
            className="h-7 w-full max-w-xs text-xs"
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={regenerateSlug}
            title="Regenerate slug dari judul"
          >
            <RefreshCw className="h-3 w-3" />
            Regenerate
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1"
      >
        <TabsList className="w-full justify-start rounded-lg border bg-card p-1">
          <TabsTrigger value="konten">Konten</TabsTrigger>
          <TabsTrigger value="klasifikasi">Klasifikasi</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="publikasi">Publikasi</TabsTrigger>
        </TabsList>

        <TabsContent value="konten" className="mt-4">
          <TabKonten
            excerpt={state.excerpt}
            contentMarkdown={state.contentMarkdown}
            featuredImageUrl={state.featuredImageUrl}
            featuredImageAlt={state.featuredImageAlt}
            onChange={(p) => patch(p)}
          />
        </TabsContent>

        <TabsContent value="klasifikasi" className="mt-4">
          <TabKlasifikasi
            categories={categories}
            tags={tags}
            selectedCategoryId={state.categoryId}
            selectedTagIds={state.tagIds}
            onChange={(p) => patch(p)}
          />
        </TabsContent>

        <TabsContent value="seo" className="mt-4">
          <TabSeo
            title={state.title}
            slug={currentSlug || state.slug}
            excerpt={state.excerpt}
            contentMarkdown={state.contentMarkdown}
            metaTitle={state.metaTitle}
            metaDescription={state.metaDescription}
            metaKeywords={state.metaKeywords}
            ogImageUrl={state.ogImageUrl}
            featuredImageUrl={state.featuredImageUrl}
            targetKeyword={state.targetKeyword}
            onChange={(p) => patch(p)}
          />
        </TabsContent>

        <TabsContent value="publikasi" className="mt-4">
          <TabPublikasi
            articleId={currentId}
            status={state.status}
            publishedAt={state.publishedAt}
            isFeatured={state.isFeatured}
            isBreaking={state.isBreaking}
            featuredCount={featuredCount}
            onChange={(p) => patch(p)}
            versions={versions}
            onVersionsChange={refreshVersions}
          />
        </TabsContent>
      </Tabs>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-card/95 backdrop-blur lg:left-60">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 p-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={openPreview}
              disabled={busy !== null}
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={saveAsDraft}
              disabled={busy !== null}
            >
              {busy === 'draft' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {state.status === 'PUBLISHED' ? 'Simpan Perubahan' : 'Simpan Draft'}
              </span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={publish}
              disabled={busy !== null}
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700"
            >
              {busy === 'publish' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {state.status === 'PUBLISHED' ? 'Update Publish' : 'Publish'}
              </span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {state.status === 'PUBLISHED' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={archive}
                disabled={busy !== null}
                className="hidden sm:flex"
              >
                <CheckCircle2 className="h-4 w-4" />
                Arsipkan
              </Button>
            )}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              disabled={busy !== null}
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isEdit ? 'Hapus' : 'Buang'}
              </span>
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isEdit ? 'Hapus artikel ini?' : 'Buang draf ini?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEdit
                ? 'Artikel akan dihapus permanen beserta semua versi, komentar, dan relasi tag.'
                : 'Belum disimpan. Anda akan kembali ke daftar artikel.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy === 'delete'}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy === 'delete'}
              onClick={doDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {busy === 'delete' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isEdit ? 'Ya, hapus' : 'Ya, buang'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
