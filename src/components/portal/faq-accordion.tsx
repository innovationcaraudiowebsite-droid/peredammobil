'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { HelpCircle } from 'lucide-react'
import type { PortalFaq } from '@/lib/portal'

/**
 * FAQ accordion — pakai shadcn Accordion (type="single" collapsible).
 *
 * Setiap item: question (trigger) + answer (content) — multiline dipisah \n\n → paragraf.
 */
export function FaqAccordion({
  items,
  title = 'Pertanyaan yang Sering Diajukan',
}: {
  items: PortalFaq[]
  title?: string
}) {
  if (!items || items.length === 0) return null

  return (
    <section className="py-8">
      <div className="text-center mb-6">
        <h2 className="inline-flex items-center gap-2 text-2xl sm:text-3xl font-bold tracking-tight">
          <HelpCircle className="size-7 text-amber-500" aria-hidden />
          {title}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Jawaban lengkap untuk pertanyaan paling sering soal peredam mobil & upgrade audio di Jakarta.
        </p>
      </div>

      <Accordion
        type="single"
        collapsible
        className="rounded-xl border border-border bg-card overflow-hidden max-w-3xl mx-auto"
      >
        {items.map((f, i) => (
          <AccordionItem key={f.id} value={`faq-${f.id}`}>
            <AccordionTrigger className="px-4 sm:px-5 hover:no-underline text-left">
              <span className="flex items-start gap-3">
                <span className="shrink-0 text-amber-500 font-semibold tabular-nums w-7 text-sm pt-0.5">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-semibold text-sm sm:text-base">{f.question}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 sm:px-5 pl-14 sm:pl-[3.75rem] text-sm leading-7 text-muted-foreground">
              {renderAnswer(f.answer)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}

/** Split answer by double-newline → paragraphs. */
function renderAnswer(answer: string) {
  const paragraphs = answer
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (paragraphs.length <= 1) return <p>{answer}</p>
  return (
    <div className="space-y-3">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  )
}
