/**
 * Helper untuk artikel: hitung word count, reading time, dan render markdown → HTML.
 *
 * Markdown yang dihasilkan oleh @mdxeditor/editor hanya berisi subset standar:
 * headings, bold, italic, ul/ol, link, image, blockquote, code (inline & block),
 * horizontal rule. Subset ini cukup untuk render manual tanpa dependency berat
 * seperti remark/rehype (yang tidak ter-install di repo ini).
 */

/**
 * Hitung jumlah kata dari teks kotor (markdown atau HTML).
 * Implementasi sederhana: strip tag markdown/HTML, lalu split by whitespace.
 */
export function calculateWordCount(markdown: string): number {
  if (!markdown) return 0
  // Strip code fences (```...```) agar code blocks tidak dihitung sebagai narasi
  const noFences = markdown.replace(/```[\s\S]*?```/g, ' ')
  // Strip inline code
  const noInlineCode = noFences.replace(/`[^`]*`/g, ' ')
  // Strip HTML tags
  const noHtml = noInlineCode.replace(/<[^>]+>/g, ' ')
  // Strip markdown link images: ![alt](url) → alt
  const noImages = noHtml.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
  // Strip links: [text](url) → text
  const noLinks = noImages.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  // Strip heading/bold/italic markers
  const stripped = noLinks
    .replace(/[#*_>~]/g, ' ')
    .replace(/^-+$/gm, ' ')
  const tokens = stripped.trim().split(/\s+/).filter(Boolean)
  return tokens.length
}

/**
 * Estimasi waktu baca dalam menit (200 kata/menit standar industri).
 */
export function calculateReadingTime(markdown: string): number {
  const words = calculateWordCount(markdown)
  if (words === 0) return 1
  return Math.max(1, Math.ceil(words / 200))
}

/* -------------------------------------------------------------------------- */
/*  Markdown → HTML (subset standar yang dihasilkan MDXEditor)                */
/* -------------------------------------------------------------------------- */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Render markdown sederhana menjadi HTML.
 *
 * Mendukung: code fence, inline code, heading H1-H6, blockquote, image,
 * link, ul/ol list, bold, italic, horizontal rule, paragraf.
 *
 * Catatan: ini bukan parser markdown lengkap — hanya subset yang konsisten
 * dengan apa yang MDXEditor hasilkan via plugin default. Tidak ada table,
 * tidak ada nested formatting kompleks. Aman untuk artikel naratif.
 */
export function renderMarkdownToHtml(markdown: string): string {
  if (!markdown) return ''
  // Extract code fences terlebih dahulu supaya tidak terkena transformasi inline.
  const codeBlocks: string[] = []
  let src = markdown.replace(/```([^\n]*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const idx = codeBlocks.length
    const langClass = lang ? ` class="language-${escapeHtml(lang.trim())}"` : ''
    codeBlocks.push(
      `<pre><code${langClass}>${escapeHtml(code.replace(/\n$/, ''))}</code></pre>`,
    )
    return `\u0000CODEBLOCK${idx}\u0000`
  })

  // Normalisasi line endings
  src = src.replace(/\r\n/g, '\n')

  // Pisah per block (paragraph/baris) — process line by line lalu group
  const lines = src.split('\n')
  const htmlOut: string[] = []
  let i = 0

  let inUl = false
  let inOl = false
  let inQuote = false

  function closeLists() {
    if (inUl) {
      htmlOut.push('</ul>')
      inUl = false
    }
    if (inOl) {
      htmlOut.push('</ol>')
      inOl = false
    }
  }
  function closeQuote() {
    if (inQuote) {
      htmlOut.push('</blockquote>')
      inQuote = false
    }
  }

  while (i < lines.length) {
    const raw = lines[i]

    // Codeblock placeholder line (dari replace di atas)
    const cbMatch = raw.match(/^\u0000CODEBLOCK(\d+)\u0000$/)
    if (cbMatch) {
      closeLists()
      closeQuote()
      htmlOut.push(codeBlocks[Number(cbMatch[1])])
      i++
      continue
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(raw)) {
      closeLists()
      closeQuote()
      htmlOut.push('<hr/>')
      i++
      continue
    }

    // Heading
    const headingMatch = raw.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      closeLists()
      closeQuote()
      const level = headingMatch[1].length
      htmlOut.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`)
      i++
      continue
    }

    // Blockquote
    const quoteMatch = raw.match(/^>\s?(.*)$/)
    if (quoteMatch) {
      closeLists()
      if (!inQuote) {
        htmlOut.push('<blockquote>')
        inQuote = true
      }
      htmlOut.push(`<p>${renderInline(quoteMatch[1])}</p>`)
      i++
      continue
    } else if (inQuote && raw.trim() === '') {
      closeQuote()
      i++
      continue
    }

    // Unordered list
    const ulMatch = raw.match(/^[-*+]\s+(.*)$/)
    if (ulMatch) {
      closeQuote()
      if (!inUl) {
        closeLists()
        htmlOut.push('<ul>')
        inUl = true
      }
      htmlOut.push(`<li>${renderInline(ulMatch[1])}</li>`)
      i++
      continue
    }

    // Ordered list
    const olMatch = raw.match(/^\d+\.\s+(.*)$/)
    if (olMatch) {
      closeQuote()
      if (!inOl) {
        closeLists()
        htmlOut.push('<ol>')
        inOl = true
      }
      htmlOut.push(`<li>${renderInline(olMatch[1])}</li>`)
      i++
      continue
    }

    // Empty line → end lists/quotes, paragraph break
    if (raw.trim() === '') {
      closeLists()
      closeQuote()
      i++
      continue
    }

    // Paragraph (gabungkan baris berturut-turut non-empty tanpa marker)
    closeLists()
    if (inQuote && !raw.startsWith('>')) {
      closeQuote()
    }
    const paraLines: string[] = [raw]
    let j = i + 1
    while (
      j < lines.length &&
      lines[j].trim() !== '' &&
      !/^(#{1,6})\s/.test(lines[j]) &&
      !/^[-*+]\s/.test(lines[j]) &&
      !/^\d+\.\s/.test(lines[j]) &&
      !/^>\s?/.test(lines[j]) &&
      !/^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[j]) &&
      !/^\u0000CODEBLOCK(\d+)\u0000$/.test(lines[j])
    ) {
      paraLines.push(lines[j])
      j++
    }
    const para = paraLines.join(' ').trim()
    if (para) {
      htmlOut.push(`<p>${renderInline(para)}</p>`)
    }
    i = j
  }

  closeLists()
  closeQuote()

  return htmlOut.join('\n')
}

/**
 * Render inline markdown: bold, italic, link, image, inline code, strikethrough.
 */
function renderInline(text: string): string {
  let s = text
  // Image: ![alt](url "title")
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_m, alt, url, title) => {
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : ''
    return `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}"${titleAttr}/>`
  })
  // Link: [text](url "title")
  s = s.replace(/\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_m, txt, url, title) => {
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : ''
    return `<a href="${escapeHtml(url)}"${titleAttr}>${renderInlineBold(txt)}</a>`
  })
  s = renderInlineBold(s)
  return s
}

function renderInlineBold(text: string): string {
  let s = text
  // Bold (**text** atau __text__)
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  // Italic (*text* atau _text_) — hati-hati tidak overlap dengan bold
  s = s.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
  s = s.replace(/(?<!_)_([^_\n]+)_(?!_)/g, '<em>$1</em>')
  // Strikethrough (~~text~~)
  s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  // Inline code (`code`)
  s = s.replace(/`([^`]+)`/g, (_m, code) => `<code>${escapeHtml(code)}</code>`)
  return s
}
