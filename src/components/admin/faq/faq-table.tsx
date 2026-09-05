'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  FaqDeleteButton,
  FaqReorderButtons,
  useFaqReorder,
} from '@/components/admin/faq/faq-actions'
import { FaqDialog, type FaqRow } from '@/components/admin/faq/faq-dialog'

interface FaqTableProps {
  rows: FaqRow[]
}

export function FaqTable({ rows }: FaqTableProps) {
  const ids = rows.map((r) => r.id)
  const { isPending, move } = useFaqReorder()

  if (rows.length === 0) {
    return null
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px] pl-6">#</TableHead>
            <TableHead className="w-[80px]">Urut</TableHead>
            <TableHead>Pertanyaan</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[220px] pr-6 text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((f, idx) => (
            <TableRow key={f.id}>
              <TableCell className="pl-6 text-base font-bold text-amber-500 tabular-nums">
                {idx + 1}
              </TableCell>
              <TableCell>
                <FaqReorderButtons
                  isFirst={idx === 0}
                  isLast={idx === rows.length - 1}
                  onMove={(dir) => move(f.id, ids, dir)}
                  disabled={isPending}
                />
              </TableCell>
              <TableCell className="max-w-[480px]">
                <p className="font-medium text-foreground">{f.question}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {f.answer}
                </p>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    f.isPublished
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
                  )}
                >
                  {f.isPublished ? 'Published' : 'Draft'}
                </Badge>
              </TableCell>
              <TableCell className="pr-6 text-right">
                <div className="flex justify-end gap-1">
                  <FaqDialog
                    mode="edit"
                    faq={f}
                    trigger={
                      <Button size="sm" variant="ghost">
                        Edit
                      </Button>
                    }
                  />
                  <FaqDeleteButton faqId={f.id} question={f.question} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
