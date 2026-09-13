'use client'

import { useMemo, useRef } from 'react'
import {
  MDXEditor,
  type MDXEditorMethods,
  type ImageUploadHandler,
  headingsPlugin,
  listsPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  codeBlockPlugin,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  InsertThematicBreak,
  ListsToggle,
  UndoRedo,
  Separator,
} from '@mdxeditor/editor'

import '@mdxeditor/editor/style.css'

interface ArticleEditorProps {
  /** Initial markdown content (read only on mount). */
  value: string
  onChange: (markdown: string) => void
  placeholder?: string
}

/**
 * MDX editor wrapper untuk artikel body.
 * Plugins: headings, lists, link + dialog, image (with inline upload handler),
 * quote, thematic break, code block, markdown shortcut, toolbar.
 *
 * Catatan behavior Enter:
 *  - Enter 1x di akhir paragraf = buat paragraf baru (Lexical default split).
 *  - Shift+Enter = soft break (line break di dalam paragraf yang sama, <br>).
 *  - Toolbar "Block type" (Paragraph / Heading / Quote) bisa pakai untuk
 *    ganti tipe block tanpa harus ketik markdown.
 */
export function ArticleEditor({
  value,
  onChange,
  placeholder = 'Mulai menulis artikel di sini...',
}: ArticleEditorProps) {
  const ref = useRef<MDXEditorMethods>(null)

  // Image upload handler — di-share ke plugin image.
  // Setiap gambar yang di-insert akan otomatis upload ke /api/admin/upload-inline.
  const imageUploadHandler = useMemo<ImageUploadHandler>(
    () => async (image) => {
      try {
        const fd = new FormData()
        fd.append('file', image)
        const res = await fetch('/api/admin/upload-inline', { method: 'POST', body: fd })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.message || 'Gagal upload gambar')
        }
        const data = (await res.json()) as { ok: boolean; url?: string }
        if (!data.url) throw new Error('URL gambar tidak diterima')
        return data.url
      } catch (e) {
        // MDXEditor akan menampilkan error ini di UI
        throw e
      }
    },
    [],
  )

  return (
    <div className="article-editor-wrapper overflow-hidden rounded-lg border bg-background">
      <MDXEditor
        ref={ref}
        markdown={value}
        onChange={onChange}
        placeholder={placeholder}
        contentEditableClassName="prose prose-sm dark:prose-invert max-w-none min-h-[400px] px-4 py-3 focus:outline-none prose-blockquote:border-amber-500 prose-blockquote:bg-amber-50 prose-blockquote:rounded-r-md prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:not-italic"
        className="min-h-[460px]"
        plugins={[
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <BoldItalicUnderlineToggles />
                <Separator />
                <ListsToggle />
                <Separator />
                <CreateLink />
                <InsertImage />
                <InsertThematicBreak />
              </>
            ),
          }),
          headingsPlugin(),
          listsPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          imagePlugin({ imageUploadHandler, imageAutocompleteSuggestions: [] }),
          quotePlugin(),
          thematicBreakPlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: '' }),
          markdownShortcutPlugin(),
        ]}
      />
    </div>
  )
}
