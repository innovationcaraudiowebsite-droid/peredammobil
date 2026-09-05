'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Pencil, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface FaqRow {
  id: string
  question: string
  answer: string
  order: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

/* -------------------------------------------------------------------------- */
/*  Form (mounts only when dialog open → fresh state per open)               */
/* -------------------------------------------------------------------------- */

interface FaqFormProps {
  mode: 'create' | 'edit'
  faq?: FaqRow
  defaultOrder?: number
  onClose: () => void
}

function FaqForm({ mode, faq, defaultOrder = 1, onClose }: FaqFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [question, setQuestion] = useState(
    mode === 'edit' && faq ? faq.question : '',
  )
  const [answer, setAnswer] = useState(
    mode === 'edit' && faq ? faq.answer : '',
  )
  const [order, setOrder] = useState<string>(
    mode === 'edit' && faq
      ? String(faq.order ?? 0)
      : String(defaultOrder),
  )
  const [isPublished, setIsPublished] = useState<boolean>(
    mode === 'edit' && faq ? faq.isPublished : true,
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isPending) return
    if (!question.trim() || question.trim().length < 5) {
      toast.error('Pertanyaan wajib minimal 5 karakter.')
      return
    }
    if (!answer.trim() || answer.trim().length < 5) {
      toast.error('Jawaban wajib minimal 5 karakter.')
      return
    }

    const payload = {
      question: question.trim(),
      answer: answer.trim(),
      order: parseInt(order, 10) || 0,
      isPublished,
    }

    startTransition(async () => {
      try {
        const url = mode === 'create' ? '/api/admin/faq' : `/api/admin/faq/${faq!.id}`
        const method = mode === 'create' ? 'POST' : 'PUT'
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          toast.error(data.message || 'Gagal menyimpan FAQ.')
          return
        }
        toast.success(mode === 'create' ? 'FAQ ditambahkan.' : 'FAQ diperbarui.')
        onClose()
        router.refresh()
      } catch (err) {
        console.error('[faq-dialog] submit error:', err)
        toast.error('Terjadi kesalahan jaringan. Coba lagi.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="faq-question">
          Pertanyaan <span className="text-destructive">*</span>
        </Label>
        <Input
          id="faq-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="contoh: Berapa biaya pasang peredam mobil?"
          required
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="faq-answer">
          Jawaban <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="faq-answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Jelaskan jawaban lengkap..."
          rows={5}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="faq-order">Urutan</Label>
          <Input
            id="faq-order"
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            min={0}
            step={1}
          />
          <p className="text-xs text-muted-foreground">
            FAQ dengan urutan kecil tampil lebih dulu.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="faq-published">Status Publikasi</Label>
          <div className="flex h-9 items-center gap-2">
            <Switch
              id="faq-published"
              checked={isPublished}
              onCheckedChange={setIsPublished}
              aria-label="Toggle publikasi FAQ"
            />
            <span className="text-sm text-muted-foreground">
              {isPublished ? 'Published' : 'Draft (tersembunyi)'}
            </span>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : mode === 'create' ? (
            <>
              <Plus className="h-4 w-4" />
              Tambah
            </>
          ) : (
            'Simpan Perubahan'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

/* -------------------------------------------------------------------------- */
/*  Dialog component                                                          */
/* -------------------------------------------------------------------------- */

interface FaqDialogProps {
  mode: 'create' | 'edit'
  faq?: FaqRow
  defaultOrder?: number
  trigger?: React.ReactNode
}

export function FaqDialog({ mode, faq, defaultOrder, trigger }: FaqDialogProps) {
  const [open, setOpen] = useState(false)

  const title = mode === 'create' ? 'Tambah FAQ Baru' : 'Edit FAQ'
  const descriptionText =
    mode === 'create'
      ? 'Pertanyaan yang sering diajukan pembaca portal.'
      : 'Perbarui pertanyaan & jawaban FAQ.'

  const defaultTrigger =
    mode === 'create' ? (
      <Button className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700">
        <Plus className="h-4 w-4" />
        FAQ Baru
      </Button>
    ) : (
      <Button size="sm" variant="ghost">
        <Pencil className="h-4 w-4" />
        Edit
      </Button>
    )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>

        {open && (
          <FaqForm
            mode={mode}
            faq={faq}
            defaultOrder={defaultOrder}
            onClose={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
