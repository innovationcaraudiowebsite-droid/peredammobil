/**
 * db.ts — Prisma-compatible adapter using @supabase/supabase-js.
 *
 * Replaces @prisma/client. Provides `db.article`, `db.category`, etc with
 * methods mirroring PrismaClient API: findMany, findFirst, findUnique,
 * create, update, delete, upsert, count, updateMany, deleteMany.
 *
 * Under the hood, uses Supabase Admin client (service_role key, bypass RLS).
 *
 * Limitations vs Prisma:
 *  - `where.OR` is supported for simple `eq` cases (translates to .or())
 *  - `where.{col}.contains` → `.ilike()` (case-insensitive LIKE)
 *  - `where.{col}.notIn` → `.notIn()`
 *  - `where.{col}.not` → `.neq()`
 *  - `where.{col}.lte` → `.lte()`
 *  - `include.{rel}: true` → `.select('*, {rel}(*)')` (PostgREST auto-join)
 *  - m-n relations (Article.tags) auto-resolved via junction table
 *
 * For complex queries, use getSupabaseAdmin() directly.
 */

import 'server-only'
import { getSupabaseAdmin } from '@/lib/supabase-server'

type WhereValue = string | number | boolean | null | { [key: string]: unknown }
type WhereClause = Record<string, WhereValue>
type OrderBy = Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>>

interface FindOptions {
  where?: WhereClause
  orderBy?: OrderBy
  take?: number
  skip?: number
  select?: Record<string, unknown>
  include?: Record<string, unknown>
}

interface FindUniqueOptions {
  where: WhereClause
  select?: Record<string, unknown>
}

interface CreateOptions {
  data: Record<string, unknown>
}

interface UpdateOptions {
  where: WhereClause
  data: Record<string, unknown>
}

interface DeleteOptions {
  where: WhereClause
}

interface UpsertOptions {
  where: WhereClause
  create: Record<string, unknown>
  update?: Record<string, unknown>
}

/**
 * Build a PostgREST select string from Prisma's `select` or `include`.
 *
 * Examples:
 *  - Prisma: { select: { id: true, title: true, category: true } }
 *    → PostgREST: 'id,title,category(*)'
 *  - Prisma: { include: { tags: true, category: true } }
 *    → PostgREST: '*,tags(*),category(*)'
 */
function buildSelectString(
  select?: Record<string, unknown>,
  include?: Record<string, unknown>,
): string | undefined {
  if (select && Object.keys(select).length > 0) {
    const cols: string[] = []
    for (const [key, value] of Object.entries(select)) {
      if (value === true) cols.push(key)
      else if (value && typeof value === 'object') cols.push(`${key}(*)`)
    }
    return cols.join(',')
  }
  if (include && Object.keys(include).length > 0) {
    const cols: string[] = ['*']
    for (const [key, value] of Object.entries(include)) {
      if (value) cols.push(`${key}(*)`)
    }
    return cols.join(',')
  }
  return undefined
}

/**
 * Apply a Prisma-style `where` clause to a Supabase query builder.
 *
 * Returns the modified query (chainable).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyWhere(query: any, where: WhereClause | undefined): any {
  if (!where) return query
  for (const [key, value] of Object.entries(where)) {
    if (value === undefined || value === null) continue

    // Special: OR array (commonly used in search)
    if (key === 'OR' && Array.isArray(value)) {
      // Build PostgREST or-string: 'col1.ilike.%q%,col2.ilike.%q%'
      const parts: string[] = []
      for (const cond of value) {
        for (const [k, v] of Object.entries(cond as Record<string, unknown>)) {
          if (typeof v === 'string') parts.push(`${k}.ilike.%${v}%`)
          else if (typeof v === 'object' && v && 'contains' in (v as Record<string, unknown>)) {
            parts.push(`${k}.ilike.%${(v as { contains: string }).contains}%`)
          } else {
            parts.push(`${k}.eq.${v}`)
          }
        }
      }
      if (parts.length > 0) query = query.or(parts.join(','))
      continue
    }

    // Object operators: { contains, notIn, not, lte, gte, in, ... }
    if (typeof value === 'object' && !Array.isArray(value)) {
      const ops = value as Record<string, unknown>
      // Convert Date to ISO string for Supabase (it doesn't auto-convert)
      const toIso = (v: unknown): string | number =>
        v instanceof Date ? v.toISOString() : (v as string | number)
      if ('contains' in ops) {
        query = query.ilike(key, `%${ops.contains}%`)
      } else if ('ilike' in ops) {
        query = query.ilike(key, (ops.ilike as string).replace(/%/g, '%'))
      } else if ('notIn' in ops && Array.isArray(ops.notIn)) {
        query = query.notIn(key, ops.notIn)
      } else if ('in' in ops && Array.isArray(ops.in)) {
        query = query.in(key, ops.in)
      } else if ('not' in ops) {
        query = query.neq(key, ops.not)
      } else if ('lte' in ops) {
        query = query.lte(key, toIso(ops.lte))
      } else if ('gte' in ops) {
        query = query.gte(key, toIso(ops.gte))
      } else if ('lt' in ops) {
        query = query.lt(key, toIso(ops.lt))
      } else if ('gt' in ops) {
        query = query.gt(key, toIso(ops.gt))
      } else {
        // Unknown operator — skip
      }
      continue
    }

    // Plain equality
    query = query.eq(key, value)
  }
  return query
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyOrder(query: any, orderBy: OrderBy | undefined): any {
  if (!orderBy) return query
  const orders = Array.isArray(orderBy) ? orderBy : [orderBy]
  for (const o of orders) {
    for (const [key, dir] of Object.entries(o)) {
      query = query.order(key, { ascending: dir === 'asc' })
    }
  }
  return query
}

// Date columns to auto-convert from string to Date object (Prisma compatibility).
const DATE_COLUMNS = new Set([
  'createdAt', 'updatedAt', 'publishedAt', 'subscribedAt', 'unsubscribedAt',
  'lastLoginAt', 'subscribedAt', 'createdAt', 'updatedAt',
])

/**
 * Convert ISO date strings returned by Supabase to Date objects.
 * Prisma returns Date objects, but Supabase returns strings — many call
 * sites use .toISOString() / .toLocaleDateString() which only exists on Date.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertDates(row: any): any {
  if (!row || typeof row !== 'object') return row
  const out: any = { ...row }
  for (const key of Object.keys(out)) {
    if (DATE_COLUMNS.has(key) && typeof out[key] === 'string') {
      out[key] = new Date(out[key])
    }
  }
  return out
}

// ============================================================
// Model factory — creates a Prisma-like client for one table.
// ============================================================
function makeModel<T = any>(table: string) {
  return {
    async findMany(opts: FindOptions = {}): Promise<T[]> {
      try {
        let q = getSupabaseAdmin().from(table)
        const includeKeys = opts.include ? Object.keys(opts.include) : []
        const needsCategory = includeKeys.includes('category')
        const needsTags = includeKeys.includes('tags')
        const needsAuthor = includeKeys.includes('author')
        const needsEditedByUser = includeKeys.includes('editedByUser')
        // Detect nested select in opts.select (Prisma-style: select: { category: { select: {...} } })
        // Treat these as include, then filter to selected fields later.
        const selectKeys = opts.select ? Object.keys(opts.select) : []
        const nestedSelectKeys = selectKeys.filter(
          (k) => opts.select![k] && typeof opts.select![k] === 'object',
        )
        const needsCategoryViaSelect = nestedSelectKeys.includes('category')
        const needsTagsViaSelect = nestedSelectKeys.includes('tags')
        const needsArticleViaSelect = nestedSelectKeys.includes('article')
        const flatSelectKeys = selectKeys.filter(
          (k) => opts.select![k] === true || typeof opts.select![k] !== 'object',
        )
        // Auto-add foreign key columns needed for relation joins
        // (Prisma's nested select doesn't include FK explicitly, but we need it)
        // ONLY auto-add if user specified explicit select (opts.select exists).
        // If no opts.select (only include), we use '*' which already has all columns.
        if (opts.select && (needsCategory || needsCategoryViaSelect) && !flatSelectKeys.includes('categoryId')) {
          flatSelectKeys.push('categoryId')
        }
        if (opts.select && needsAuthor && !flatSelectKeys.includes('authorId')) {
          flatSelectKeys.push('authorId')
        }
        if (opts.select && (includeKeys.includes('article') || needsArticleViaSelect) && !flatSelectKeys.includes('articleId')) {
          flatSelectKeys.push('articleId')
        }
        // Plain select without relations (we fetch separately)
        // If no explicit select (opts.select undefined), use '*' to get all columns
        const hasExplicitSelect = opts.select && Object.keys(opts.select).length > 0
        const flatSelect = hasExplicitSelect
          ? (flatSelectKeys.length > 0 ? flatSelectKeys.join(',') : '*')
          : '*'
        q = q.select(flatSelect)
        q = applyWhere(q, opts.where)
        q = applyOrder(q, opts.orderBy)
        if (opts.take) {
          if (opts.skip) q = q.range(opts.skip, opts.skip + opts.take - 1)
          else q = q.limit(opts.take)
        } else if (opts.skip) {
          q = q.range(opts.skip, opts.skip + 99)
        }
        const { data, error } = await q
        if (error) {
          console.error(`[db.${table}.findMany]`, error.message)
          return []
        }
        let rows = (data || []).map((r: any) => convertDates(r)) as T[]

        // Manual include: category (from include OR nested select)
        if ((needsCategory || needsCategoryViaSelect) && rows.length > 0 && table === 'articles') {
          const catIds = [...new Set(rows.map((r: any) => r.categoryId).filter(Boolean))]
          if (catIds.length > 0) {
            const { data: cats } = await getSupabaseAdmin()
              .from('categories')
              .select('*')
              .in('id', catIds)
            const catMap = new Map((cats || []).map((c: any) => [c.id, c]))
            rows = rows.map((r: any) => ({ ...r, category: catMap.get(r.categoryId) || null }))
          }
        }

        // Manual include: author
        if (needsAuthor && rows.length > 0 && table === 'articles') {
          const authorIds = [...new Set(rows.map((r: any) => r.authorId).filter(Boolean))]
          if (authorIds.length > 0) {
            const { data: authors } = await getSupabaseAdmin()
              .from('profiles')
              .select('*')
              .in('id', authorIds)
            const aMap = new Map((authors || []).map((a: any) => [a.id, a]))
            rows = rows.map((r: any) => ({ ...r, author: r.authorId ? aMap.get(r.authorId) : null }))
          }
        }

        // Manual include: tags (m-n via _ArticleTags junction)
        if ((needsTags || needsTagsViaSelect) && rows.length > 0 && table === 'articles') {
          const articleIds = rows.map((r: any) => r.id)
          const { data: junction } = await getSupabaseAdmin()
            .from('_ArticleTags')
            .select('A, B')
            .in('A', articleIds)
          const tagIds = [...new Set((junction || []).map((j: any) => j.B))]
          if (tagIds.length > 0) {
            const { data: tags } = await getSupabaseAdmin()
              .from('tags')
              .select('*')
              .in('id', tagIds)
            const tagMap = new Map((tags || []).map((t: any) => [t.id, t]))
            const tagsByArticle = new Map<string, any[]>()
            for (const j of (junction || [])) {
              const arr = tagsByArticle.get((j as any).A) || []
              const t = tagMap.get((j as any).B)
              if (t) arr.push(t)
              tagsByArticle.set((j as any).A, arr)
            }
            rows = rows.map((r: any) => ({ ...r, tags: tagsByArticle.get(r.id) || [] }))
          } else {
            rows = rows.map((r: any) => ({ ...r, tags: [] }))
          }
        }

        // Manual include: editedByUser (article_versions)
        if (needsEditedByUser && rows.length > 0 && table === 'article_versions') {
          const uIds = [...new Set(rows.map((r: any) => r.editedByUserId).filter(Boolean))]
          if (uIds.length > 0) {
            const { data: users } = await getSupabaseAdmin()
            .from('profiles')
            .select('*')
            .in('id', uIds)
            const uMap = new Map((users || []).map((u: any) => [u.id, u]))
            rows = rows.map((r: any) => ({ ...r, editedByUser: r.editedByUserId ? uMap.get(r.editedByUserId) : null }))
          }
        }

        // Manual include: articles (for tags & categories — m-n / 1-n)
        if (includeKeys.includes('articles') && rows.length > 0 && (table === 'tags' || table === 'categories')) {
          const parentIds = rows.map((r: any) => r.id)
          if (table === 'tags') {
            const { data: junction } = await getSupabaseAdmin()
              .from('_ArticleTags')
              .select('A, B')
              .in('B', parentIds)
            const countByParent = new Map<string, number>()
            for (const j of (junction || [])) {
              countByParent.set((j as any).B, (countByParent.get((j as any).B) || 0) + 1)
            }
            // Optional: fetch actual articles if include.articles is true (not just count)
            const includeArticlesObj = opts.include?.articles as any
            if (includeArticlesObj === true) {
              const articleIds = [...new Set((junction || []).map((j: any) => j.A))]
              let articleMap = new Map<string, any>()
              if (articleIds.length > 0) {
                const { data: arts } = await getSupabaseAdmin().from('articles').select('*').in('id', articleIds)
                ;(arts || []).forEach((a: any) => articleMap.set(a.id, convertDates(a)))
              }
              const articlesByParent = new Map<string, any[]>()
              for (const j of (junction || [])) {
                const arr = articlesByParent.get((j as any).B) || []
                const a = articleMap.get((j as any).A)
                if (a) arr.push(a)
                articlesByParent.set((j as any).B, arr)
              }
              rows = rows.map((r: any) => ({ ...r, articles: articlesByParent.get(r.id) || [], _count: { articles: countByParent.get(r.id) || 0 } }))
            } else {
              rows = rows.map((r: any) => ({ ...r, _count: { articles: countByParent.get(r.id) || 0 } }))
            }
          } else if (table === 'categories') {
            const { data: arts, count: artsCount } = await getSupabaseAdmin()
              .from('articles')
              .select('id, categoryId', { count: 'exact' })
              .in('categoryId', parentIds)
            const countByCat = new Map<string, number>()
            ;(arts || []).forEach((a: any) => {
              countByCat.set(a.categoryId, (countByCat.get(a.categoryId) || 0) + 1)
            })
            // Fetch actual articles if include.articles is true OR an object with select
            const includeArticlesObj = opts.include?.articles as any
            if (includeArticlesObj) {
              const selectCols = includeArticlesObj === true ? '*' :
                (includeArticlesObj.select ? Object.keys(includeArticlesObj.select).filter((k: string) => includeArticlesObj.select[k]).join(',') : '*')
              const { data: allArts } = await getSupabaseAdmin()
                .from('articles')
                .select(selectCols.includes('*') ? '*' : `id,${selectCols}`)  // always include id for matching
                .in('categoryId', parentIds)
              const artsByCat = new Map<string, any[]>()
              ;(allArts || []).forEach((a: any) => {
                const arr = artsByCat.get(a.categoryId) || []
                arr.push(a)
                artsByCat.set(a.categoryId, arr)
              })
              rows = rows.map((r: any) => ({ ...r, articles: artsByCat.get(r.id) || [], _count: { articles: countByCat.get(r.id) || 0 } }))
            } else {
              rows = rows.map((r: any) => ({ ...r, _count: { articles: countByCat.get(r.id) || 0 } }))
            }
          }
        }

        // Manual include: article (for comments — 1-n, comment.articleId → article.id)
        if ((includeKeys.includes('article') || needsArticleViaSelect) && rows.length > 0 && table === 'comments') {
          const aIds = [...new Set(rows.map((r: any) => r.articleId).filter(Boolean))]
          if (aIds.length > 0) {
            const { data: arts } = await getSupabaseAdmin().from('articles').select('*').in('id', aIds)
            const aMap = new Map((arts || []).map((a: any) => [a.id, convertDates(a)]))
            rows = rows.map((r: any) => ({ ...r, article: aMap.get(r.articleId) || null }))
          } else {
            rows = rows.map((r: any) => ({ ...r, article: null }))
          }
        }

        return rows
      } catch (err) {
        console.error(`[db.${table}.findMany] catch:`, err)
        return []
      }
    },

    async findFirst(opts: FindOptions = {}): Promise<T | null> {
      const rows = await (this as any).findMany({ ...opts, take: 1 })
      return rows[0] || null
    },

    async findUnique(opts: FindUniqueOptions): Promise<T | null> {
      try {
        let q = getSupabaseAdmin().from(table)
        const selectStr = buildSelectString(opts.select, undefined)
        if (selectStr) q = q.select(selectStr)
        else q = q.select('*')
        q = applyWhere(q, opts.where)
        // Use single() with eq (more reliable than maybeSingle in some cases)
        const { data, error } = await q.single()
        if (error) {
          // Single returns error on 0 or >1 rows. For findUnique, 0 rows = null (not error)
          if (error.code === 'PGRST116') return null
          console.error(`[db.${table}.findUnique]`, error.message)
          return null
        }
        return (convertDates(data) as T) || null
      } catch (err) {
        console.error(`[db.${table}.findUnique] catch:`, err)
        return null
      }
    },

    async create(opts: CreateOptions): Promise<T> {
      // Handle nested m-n connect (Prisma-style): data.tags.connect
      const { tags: tagsConnect, ...articleData } = opts.data as any
      // Auto-generate UUID if 'id' not provided (Supabase doesn't auto-gen like Prisma's cuid)
      if (!articleData.id) {
        articleData.id = crypto.randomUUID()
      }
      if (tagsConnect && tagsConnect.connect && Array.isArray(tagsConnect.connect) && table === 'articles') {
        // Create article first
        const { data, error } = await getSupabaseAdmin()
          .from(table)
          .insert(articleData)
          .select()
          .maybeSingle()
        if (error) throw new Error(`[db.${table}.create] ${error.message}`)
        const article = data as T
        // Connect tags via junction
        const tagIds = tagsConnect.connect.map((c: any) => c.id)
        await connectArticleTags((article as any).id, tagIds)
        return article
      }
      const { data, error } = await getSupabaseAdmin()
        .from(table)
        .insert(articleData)
        .select()
        .maybeSingle()
      if (error) throw new Error(`[db.${table}.create] ${error.message}`)
      return data as T
    },

    async update(opts: UpdateOptions): Promise<T> {
      // Handle nested m-n: data.tags.connect / set / disconnect
      const { tags: tagsUpdate, ...updateData } = opts.data as any
      if (tagsUpdate) {
        let q = getSupabaseAdmin().from(table).update(updateData)
        q = applyWhere(q, opts.where)
        const { data, error } = await q.select().maybeSingle()
        if (error) throw new Error(`[db.${table}.update] ${error.message}`)
        if (tagsUpdate.set && Array.isArray(tagsUpdate.set)) {
          const id = (opts.where as any).id || (data as any)?.id
          if (id) await syncArticleTags(id, tagsUpdate.set.map((t: any) => t.id))
        } else if (tagsUpdate.connect && Array.isArray(tagsUpdate.connect)) {
          const id = (data as any)?.id
          if (id) await connectArticleTags(id, tagsUpdate.connect.map((t: any) => t.id))
        }
        return data as T
      }
      let q = getSupabaseAdmin().from(table).update(opts.data)
      q = applyWhere(q, opts.where)
      const { data, error } = await q.select().maybeSingle()
      if (error) throw new Error(`[db.${table}.update] ${error.message}`)
      return data as T
    },

    async updateMany(opts: { where: WhereClause; data: Record<string, unknown> }): Promise<{ count: number }> {
      let q = getSupabaseAdmin().from(table).update(opts.data)
      q = applyWhere(q, opts.where)
      const { count, error } = await q
      if (error) throw new Error(`[db.${table}.updateMany] ${error.message}`)
      return { count: count || 0 }
    },

    async delete(opts: DeleteOptions): Promise<void> {
      let q = getSupabaseAdmin().from(table).delete()
      q = applyWhere(q, opts.where)
      const { error } = await q
      if (error) throw new Error(`[db.${table}.delete] ${error.message}`)
    },

    async deleteMany(opts: { where: WhereClause }): Promise<{ count: number }> {
      let q = getSupabaseAdmin().from(table).delete()
      q = applyWhere(q, opts.where)
      const { count, error } = await q
      if (error) throw new Error(`[db.${table}.deleteMany] ${error.message}`)
      return { count: count || 0 }
    },

    async upsert(opts: UpsertOptions): Promise<T> {
      // Try find first (without .single() to avoid errors on 0 rows)
      let fq = getSupabaseAdmin().from(table).select('*')
      fq = applyWhere(fq, opts.where)
      fq = fq.limit(1)
      const { data: existing, error: findErr } = await fq
      if (findErr) console.warn(`[db.${table}.upsert] find:`, findErr.message)

      if (existing && existing.length > 0) {
        // Update — use maybeSingle to avoid error if no rows match (RLS edge case)
        let uq = getSupabaseAdmin().from(table).update(opts.update || {})
        uq = applyWhere(uq, opts.where)
        const { data, error } = await uq.select().maybeSingle()
        if (error) throw new Error(`[db.${table}.upsert.update] ${error.message}`)
        if (data) return data as T
        // Fallback: re-fetch if update returned null (RLS policy edge case)
        const r = await getSupabaseAdmin().from(table).select('*').eq('id', (opts.where as { id?: string }).id || '').maybeSingle()
        if (r.data) return r.data as T
      }
      // Create
      const { data, error } = await getSupabaseAdmin()
        .from(table)
        .insert(opts.create)
        .select()
        .maybeSingle()
      if (error) throw new Error(`[db.${table}.upsert.create] ${error.message}`)
      return data as T
    },

    async count(opts: { where?: WhereClause } = {}): Promise<number> {
      let q = getSupabaseAdmin().from(table).select('*', { count: 'exact', head: true })
      q = applyWhere(q, opts.where)
      const { count, error } = await q
      if (error) {
        console.error(`[db.${table}.count]`, error.message)
        return 0
      }
      return count || 0
    },

    /**
     * Aggregate — Prisma-compatible. Only `_sum` is supported (fetch all rows
     * and sum in app; Supabase doesn't expose native SUM via REST).
     */
    async aggregate(opts: {
      where?: WhereClause
      _sum?: Record<string, true>
      _count?: boolean
    }): Promise<Record<string, any>> {
      const selectCols: string[] = []
      if (opts._sum) selectCols.push(...Object.keys(opts._sum))
      let q = getSupabaseAdmin().from(table).select(selectCols.join(',') || '*')
      q = applyWhere(q, opts.where)
      const { data, error } = await q
      if (error) {
        console.error(`[db.${table}.aggregate]`, error.message)
        return { _sum: {}, _count: 0 }
      }
      const rows = data || []
      const result: any = { _sum: {}, _count: rows.length }
      if (opts._sum) {
        for (const key of Object.keys(opts._sum)) {
          result._sum[key] = rows.reduce((acc: number, r: any) => acc + (Number(r[key]) || 0), 0)
        }
      }
      return result
    },

    // Raw access — for queries that don't fit the adapter
    raw() {
      return getSupabaseAdmin().from(table)
    },
  }
}

// ============================================================
// db — Prisma-compatible client (uses Supabase under the hood)
// ============================================================
export const db = {
  article: makeModel<Article>('articles'),
  category: makeModel<Category>('categories'),
  tag: makeModel<Tag>('tags'),
  faq: makeModel<Faq>('faqs'),
  comment: makeModel<Comment>('comments'),
  subscriber: makeModel<Subscriber>('subscribers'),
  siteSetting: makeModel<SiteSetting>('site_settings'),
  profile: makeModel<Profile>('profiles'),
  articleVersion: makeModel<ArticleVersion>('article_versions'),
  // Junction table for Article <-> Tag (m-n). Columns: A (articleId), B (tagId).
  _articleTags: makeModel('_ArticleTags'),
}

// Re-export types for convenience
import type {
  Article,
  ArticleVersion,
  Category,
  Comment,
  Faq,
  Profile,
  SiteSetting,
  Subscriber,
  Tag,
} from './types'

// ============================================================
// Article <-> Tag m-n helpers (manual handling).
// ============================================================
/**
 * Connect tags to an article (add new links, don't touch existing).
 */
export async function connectArticleTags(articleId: string, tagIds: string[]): Promise<void> {
  if (!tagIds.length) return
  const rows = tagIds.map((tagId) => ({ A: articleId, B: tagId }))
  const { error } = await getSupabaseAdmin().from('_ArticleTags').upsert(rows, { onConflict: 'A,B' })
  if (error) console.error('[db.connectArticleTags]', error.message)
}

/**
 * Sync tags for an article: delete all existing links, then insert new.
 */
export async function syncArticleTags(articleId: string, tagIds: string[]): Promise<void> {
  // Delete existing
  const { error: delErr } = await getSupabaseAdmin()
    .from('_ArticleTags')
    .delete()
    .eq('A', articleId)
  if (delErr) console.error('[db.syncArticleTags.delete]', delErr.message)
  // Insert new
  if (tagIds.length > 0) {
    await connectArticleTags(articleId, tagIds)
  }
}

/**
 * Get tag IDs linked to an article.
 */
export async function getArticleTagIds(articleId: string): Promise<string[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('_ArticleTags')
    .select('B')
    .eq('A', articleId)
  if (error) {
    console.error('[db.getArticleTagIds]', error.message)
    return []
  }
  return (data || []).map((row) => row.B as string)
}
