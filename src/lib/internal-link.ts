import 'server-only'

/**
 * Internal link insertion utility.
 *
 * Parses an article HTML body and inserts <a href="/berita/{cat}/{slug}">
 * links into mentions of other article titles (first occurrence only).
 *
 * Rules:
 *  - Skip article titles shorter than 4 words (too generic).
 *  - Skip if the title is already inside an <a> tag.
 *  - Skip if title appears inside <h1>, <h2>, <h3>, <h4>, <h5>, <h6>.
 *  - Max 3 internal links per article.
 *  - Case-insensitive exact phrase match.
 */

export interface InternalLinkTarget {
  title: string
  slug: string
  categorySlug: string
}

const MAX_LINKS = 3
const MIN_WORDS = 4

/**
 * Build a regex that matches the title as a whole phrase,
 * case-insensitive, ignoring leading/trailing whitespace.
 *
 * We escape regex metacharacters in the title.
 */
function buildTitleRegex(title: string): RegExp {
  const escaped = title
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s+')
  return new RegExp(`\\b${escaped}\\b`, 'i')
}

/**
 * Determine if a position in HTML is inside a heading tag or an anchor tag.
 * Walks backwards from `pos` to find the nearest unclosed start tag.
 */
function isInsideAvoidTag(html: string, pos: number): boolean {
  // Walk backwards collecting start/end tags, tracking depth of each "avoid" tag.
  // Avoid tags: a, h1..h6.
  // We use a simple stack-based scan.
  const avoidTag = /^(a|h[1-6])$/i
  // Build list of tag boundaries up to pos.
  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*?\/?>/g
  const stack: string[] = []
  let m: RegExpExecArray | null
  while ((m = tagPattern.exec(html)) !== null) {
    if (m.index >= pos) break
    const tag = m[0]
    const name = m[1].toLowerCase()
    if (!avoidTag.test(name)) continue
    const isSelfClose = tag.endsWith('/>')
    const isEndTag = tag.startsWith('</')
    if (isEndTag) {
      // Pop from stack if matches.
      const idx = stack.lastIndexOf(name)
      if (idx !== -1) stack.splice(idx, 1)
    } else if (isSelfClose) {
      // Ignore — self-closing doesn't open a region.
    } else {
      stack.push(name)
    }
  }
  return stack.length > 0
}

/**
 * Add internal links to an article HTML body.
 *
 * @param html Original article HTML body.
 * @param articles Candidate articles whose titles to link to (excludes current article).
 * @returns HTML with up to MAX_LINKS <a> tags inserted.
 */
export function addInternalLinks(
  html: string,
  articles: InternalLinkTarget[],
): string {
  if (!html || articles.length === 0) return html

  // Sort candidates by title length desc (longer titles first → more specific).
  const candidates = articles
    .filter((a) => a.title.trim().split(/\s+/).length >= MIN_WORDS)
    .sort((a, b) => b.title.length - a.title.length)

  let result = html
  let inserted = 0

  for (const cand of candidates) {
    if (inserted >= MAX_LINKS) break
    const re = buildTitleRegex(cand.title)
    re.lastIndex = 0
    const match = re.exec(result)
    if (!match) continue
    const pos = match.index
    if (isInsideAvoidTag(result, pos)) continue

    const matchedText = match[0]
    const href = `/berita/${cand.categorySlug}/${cand.slug}`
    const replacement = `<a href="${href}" class="portal-internal-link">${matchedText}</a>`
    result =
      result.slice(0, pos) +
      replacement +
      result.slice(pos + matchedText.length)
    inserted++
  }

  return result
}
