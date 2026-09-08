'use client'

interface GooglePreviewProps {
  url: string
  title: string
  description: string
  imageUrl?: string | null
}

/**
 * Mockup hasil search Google untuk meta title + description.
 */
export function GooglePreview({
  url,
  title,
  description,
  imageUrl,
}: GooglePreviewProps) {
  // Tampilan seperti search result Google (singkat, ringkas)
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-[10px] font-bold text-white">
          P
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">Peredam Mobil Jakarta</span>
          <span className="text-[11px] text-muted-foreground">{url}</span>
        </div>
      </div>
      <p className="mt-1 line-clamp-1 text-[18px] font-medium leading-snug text-blue-700 dark:text-blue-400">
        {title || 'Judul artikel akan tampil di sini'}
      </p>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
        {description || 'Deskripsi artikel akan tampil di sini.'}
      </p>
      {imageUrl && (
        <div className="mt-2 overflow-hidden rounded border">
          <img
            src={imageUrl}
            alt="Thumbnail"
            className="h-20 w-full object-cover"
          />
        </div>
      )}
    </div>
  )
}
