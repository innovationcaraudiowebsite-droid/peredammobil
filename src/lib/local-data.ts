/**
 * local-data.ts — Read-only JSON-backed data layer.
 *
 * When Supabase credentials are NOT configured, this module reads from
 * `data/backup-sqlite.json` (a full export of the production database)
 * and implements the same Prisma-like API as `db.ts`.
 *
 * Supported:
 *  - findMany / findFirst / findUnique / count / aggregate (read-only)
 *  - where: { col: val } (eq), { col: { contains } }, { col: { in } },
 *    { col: { notIn } }, { col: { not } }, { col: { lte|gte|lt|gt } },
 *    { OR: [ {col: {contains}}, ... ] }
 *  - orderBy: { col: 'asc'|'desc' } | [ {col}, ... ]
 *  - take / skip
 *  - select: { col: true, relation: { select: {...} } }
 *  - include: { category: true, tags: true, articles: true, article: true }
 *
 * Write operations (create/update/delete/upsert) are NOT supported here —
 * they require a real database. Callers that need writes should configure
 * Supabase credentials.
 */
import 'server-only'
import fs from 'node:fs'
import path from 'node:path'

const BACKUP_FILE = path.join(process.cwd(), 'data', 'backup-sqlite.json')

let _cache: Record<string, unknown> | null = null

function loadBackup(): Record<string, unknown> {
  if (_cache) return _cache
  try {
    if (!fs.existsSync(BACKUP_FILE)) {
      _cache = {}
      return _cache
    }
    const raw = fs.readFileSync(BACKUP_FILE, 'utf-8')
    _cache = JSON.parse(raw) as Record<string, unknown>
  } catch (err) {
    console.warn('[local-data] failed to read backup file:', err)
    _cache = {}
  }
  return _cache
}

/**
 * Map a logical table name (used by db.ts / Supabase) to the key used in
 * the backup JSON file. The backup was exported from SQLite with camelCase
 * table names, while Supabase uses snake_case.
 */
function mapTable(table: string): string {
  const map: Record<string, string> = {
    articles: 'articles',
    categories: 'categories',
    tags: 'tags',
    faqs: 'faqs',
    subscribers: 'subscribers',
    comments: 'comments',
    site_settings: 'siteSettings',
    article_versions: 'articleVersions',
    _ArticleTags: 'articleTags',
    products: 'products', // not in backup → empty
    profiles: 'profiles', // not in backup → empty
  }
  return map[table] || table
}

function getRows(table: string): Record<string, unknown>[] {
  const data = loadBackup()
  const key = mapTable(table)
  const rows = data[key]
  if (!Array.isArray(rows)) return []
  return rows as Record<string, unknown>[]
}

// Date columns to auto-convert from string → Date (Prisma compatibility).
const DATE_COLUMNS = new Set([
  'createdAt',
  'updatedAt',
  'publishedAt',
  'subscribedAt',
  'unsubscribedAt',
  'lastLoginAt',
])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertDates(row: any): any {
  if (!row || typeof row !== 'object') return row
  const out: any = { ...row }
  for (const key of Object.keys(out)) {
    if (DATE_COLUMNS.has(key) && typeof out[key] === 'string') {
      const d = new Date(out[key])
      if (!isNaN(d.getTime())) out[key] = d
    }
  }
  return out
}

type WhereValue = string | number | boolean | null | { [key: string]: unknown }
type WhereClause = Record<string, WhereValue>
type OrderBy = Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function matchWhere(row: any, where: WhereClause | undefined): boolean {
  if (!where) return true
  for (const [key, value] of Object.entries(where)) {
    if (value === undefined || value === null) continue

    // OR: array of conditions, any match passes
    if (key === 'OR' && Array.isArray(value)) {
      const orMatch = (value as WhereClause[]).some((cond) => matchWhere(row, cond))
      if (!orMatch) return false
      continue
    }

    // Object operators
    if (typeof value === 'object' && !Array.isArray(value)) {
      const ops = value as Record<string, unknown>
      const cell = row[key]
      if ('contains' in ops) {
        const needle = String(ops.contains).toLowerCase()
        const hay = cell == null ? '' : String(cell).toLowerCase()
        if (!hay.includes(needle)) return false
      } else if ('ilike' in ops) {
        const needle = String(ops.ilike).replace(/%/g, '').toLowerCase()
        const hay = cell == null ? '' : String(cell).toLowerCase()
        if (!hay.includes(needle)) return false
      } else if ('in' in ops && Array.isArray(ops.in)) {
        if (!ops.in.includes(cell)) return false
      } else if ('notIn' in ops && Array.isArray(ops.notIn)) {
        if (ops.notIn.includes(cell)) return false
      } else if ('not' in ops) {
        if (cell === ops.not) return false
      } else if ('lte' in ops) {
        const target = ops.lte instanceof Date ? ops.lte.toISOString() : ops.lte
        if (cell == null || String(cell) > String(target)) return false
      } else if ('gte' in ops) {
        const target = ops.gte instanceof Date ? ops.gte.toISOString() : ops.gte
        if (cell == null || String(cell) < String(target)) return false
      } else if ('lt' in ops) {
        const target = ops.lt instanceof Date ? ops.lt.toISOString() : ops.lt
        if (cell == null || String(cell) >= String(target)) return false
      } else if ('gt' in ops) {
        const target = ops.gt instanceof Date ? ops.gt.toISOString() : ops.gt
        if (cell == null || String(cell) <= String(target)) return false
      }
      continue
    }

    // Plain equality
    if (row[key] !== value) return false
  }
  return true
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sortRows(rows: any[], orderBy: OrderBy | undefined): any[] {
  if (!orderBy) return rows
  const orders = Array.isArray(orderBy) ? orderBy : [orderBy]
  const sorted = [...rows]
  sorted.sort((a, b) => {
    for (const o of orders) {
      for (const [key, dir] of Object.entries(o)) {
        const av = a[key]
        const bv = b[key]
        if (av === bv) continue
        // Treat null/undefined as "least"
        const aNull = av == null
        const bNull = bv == null
        if (aNull && !bNull) return dir === 'asc' ? -1 : 1
        if (!aNull && bNull) return dir === 'asc' ? 1 : -1
        // Compare as strings (works for dates in ISO format too)
        const cmp = String(av) < String(bv) ? -1 : 1
        return dir === 'asc' ? cmp : -cmp
      }
    }
    return 0
  })
  return sorted
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pickFields(row: any, select: Record<string, unknown> | undefined): any {
  if (!select || Object.keys(select).length === 0) return row
  const out: any = {}
  for (const [key, val] of Object.entries(select)) {
    if (val === true) {
      out[key] = row[key]
    } else if (val && typeof val === 'object') {
      // Nested relation select — handled separately by relation joiners
      // Keep the relation field as-is (filled later)
    }
  }
  return out
}

interface FindOptions {
  where?: WhereClause
  orderBy?: OrderBy
  take?: number
  skip?: number
  select?: Record<string, unknown>
  include?: Record<string, unknown>
}

// ============================================================
// Relation resolvers
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function joinCategory(rows: any[], table: string): any[] {
  if (table !== 'articles' || rows.length === 0) return rows
  const catRows = getRows('categories')
  const catMap = new Map(catRows.map((c) => [c.id, convertDates(c)]))
  return rows.map((r) => ({ ...r, category: r.categoryId ? catMap.get(r.categoryId) || null : null }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function joinTags(rows: any[], table: string): any[] {
  if (table !== 'articles' || rows.length === 0) return rows
  const junction = getRows('_ArticleTags') as Array<Record<string, string>>
  const tagRows = getRows('tags')
  const tagMap = new Map(tagRows.map((t) => [t.id, convertDates(t)]))
  const tagsByArticle = new Map<string, unknown[]>()
  for (const j of junction) {
    const aId = j.articleId
    const tId = j.tagId
    if (!aId || !tId) continue
    const arr = tagsByArticle.get(aId) || []
    const t = tagMap.get(tId)
    if (t) arr.push(t)
    tagsByArticle.set(aId, arr)
  }
  return rows.map((r) => ({ ...r, tags: tagsByArticle.get(r.id) || [] }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function joinArticlesForCategory(rows: any[], table: string, include: Record<string, unknown> | undefined): any[] {
  if (table !== 'categories' || rows.length === 0) return rows
  const arts = getRows('articles')
  const countByCat = new Map<string, number>()
  for (const a of arts) {
    const cid = a.categoryId as string
    if (cid) countByCat.set(cid, (countByCat.get(cid) || 0) + 1)
  }
  const wantArticles = include?.articles
  if (wantArticles) {
    const artsByCat = new Map<string, unknown[]>()
    for (const a of arts) {
      const cid = a.categoryId as string
      if (!cid) continue
      const arr = artsByCat.get(cid) || []
      arr.push(convertDates(a))
      artsByCat.set(cid, arr)
    }
    return rows.map((r) => ({ ...r, articles: artsByCat.get(r.id) || [], _count: { articles: countByCat.get(r.id) || 0 } }))
  }
  return rows.map((r) => ({ ...r, _count: { articles: countByCat.get(r.id) || 0 } }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function joinArticleForComment(rows: any[], table: string): any[] {
  if (table !== 'comments' || rows.length === 0) return rows
  const arts = getRows('articles')
  const artMap = new Map(arts.map((a) => [a.id, convertDates(a)]))
  return rows.map((r) => ({ ...r, article: r.articleId ? artMap.get(r.articleId) || null : null }))
}

// ============================================================
// Public API — mirrors makeModel() read methods
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function localFindMany(table: string, opts: FindOptions = {}): any[] {
  try {
    let rows = getRows(table).map((r) => convertDates(r))

    // where
    if (opts.where) {
      rows = rows.filter((r) => matchWhere(r, opts.where as WhereClause))
    }

    // orderBy
    rows = sortRows(rows, opts.orderBy)

    // skip / take
    if (opts.skip) rows = rows.slice(opts.skip)
    if (opts.take) rows = rows.slice(0, opts.take)

    // Relations (include OR nested select relation)
    const includeKeys = opts.include ? Object.keys(opts.include) : []
    const selectKeys = opts.select ? Object.keys(opts.select) : []
    const nestedSelectKeys = selectKeys.filter(
      (k) => opts.select![k] && typeof opts.select![k] === 'object',
    )
    const needCategory = includeKeys.includes('category') || nestedSelectKeys.includes('category')
    const needTags = includeKeys.includes('tags') || nestedSelectKeys.includes('tags')
    const needArticles = includeKeys.includes('articles')
    const needArticle = includeKeys.includes('article') || nestedSelectKeys.includes('article')

    if (needCategory) rows = joinCategory(rows, table)
    if (needTags) rows = joinTags(rows, table)
    if (needArticles) rows = joinArticlesForCategory(rows, table, opts.include)
    if (needArticle) rows = joinArticleForComment(rows, table)

    // select (flat field picking — relations already joined above)
    if (opts.select && Object.keys(opts.select).length > 0) {
      const flatKeys = selectKeys.filter(
        (k) => opts.select![k] === true || typeof opts.select![k] !== 'object',
      )
      // If there are nested relation selects, keep the joined relation fields too
      rows = rows.map((r) => {
        const out: Record<string, unknown> = {}
        for (const k of flatKeys) out[k] = r[k]
        for (const k of nestedSelectKeys) {
          // keep the relation field (already joined): pick sub-fields if specified
          const subSel = (opts.select as Record<string, Record<string, unknown>>)[k]
          const rel = r[k]
          if (Array.isArray(rel)) {
            out[k] = rel.map((item) => pickFields(item, subSel && subSel.select ? subSel.select : undefined))
          } else if (rel && typeof rel === 'object') {
            out[k] = pickFields(rel, subSel && subSel.select ? subSel.select : undefined)
          } else {
            out[k] = rel
          }
        }
        return out
      })
    }

    return rows
  } catch (err) {
    console.error(`[local-data.${table}.findMany] error:`, err)
    return []
  }
}

export function localFindFirst(table: string, opts: FindOptions = {}): unknown {
  const rows = localFindMany(table, { ...opts, take: 1 })
  return rows[0] || null
}

export function localFindUnique(
  table: string,
  opts: { where: WhereClause; select?: Record<string, unknown>; include?: Record<string, unknown> },
): unknown {
  const rows = localFindMany(table, {
    where: opts.where,
    select: opts.select,
    include: opts.include,
    take: 1,
  })
  return rows[0] || null
}

export function localCount(table: string, opts: { where?: WhereClause } = {}): number {
  try {
    const rows = getRows(table)
    if (!opts.where) return rows.length
    return rows.filter((r) => matchWhere(r, opts.where as WhereClause)).length
  } catch {
    return 0
  }
}

export function localAggregate(
  table: string,
  opts: { where?: WhereClause; _sum?: Record<string, true>; _count?: boolean },
): Record<string, unknown> {
  try {
    let rows = getRows(table)
    if (opts.where) rows = rows.filter((r) => matchWhere(r, opts.where as WhereClause))
    const result: Record<string, unknown> = { _sum: {}, _count: rows.length }
    if (opts._sum) {
      for (const key of Object.keys(opts._sum)) {
        result._sum[key] = rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0)
      }
    }
    return result
  } catch {
    return { _sum: {}, _count: 0 }
  }
}
