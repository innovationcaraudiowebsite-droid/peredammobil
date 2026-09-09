/**
 * Type definitions for database tables (replaces @prisma/client types).
 *
 * Field types use `string | Date` because Supabase returns ISO strings for
 * timestamptz columns, but our code may pass Date objects on insert/update.
 */

export type SiteSetting = {
  id: string
  siteName: string
  tagline: string
  logoUrl: string | null
  faviconUrl: string | null
  contactEmail: string
  contactAddress: string
  contactPhone: string | null
  socialFacebook: string | null
  socialInstagram: string | null
  socialYoutube: string | null
  authorName: string
  newsletterHeadline: string
  newsletterSubtext: string
  footerCopyright: string
  primaryColor: string
  gaMeasurementId: string | null
  gtmId: string | null
  verificationGoogle: string | null
  verificationBing: string | null
  updatedAt: string | Date
}

export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  order: number
  createdAt: string | Date
  updatedAt: string | Date
}

export type Tag = {
  id: string
  name: string
  slug: string
  createdAt: string | Date
}

export type Article = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  contentMarkdown: string | null
  featuredImageUrl: string | null
  featuredImageAlt: string | null
  categoryId: string
  authorName: string
  authorId: string | null
  status: string // DRAFT | PUBLISHED | ARCHIVED
  isFeatured: boolean
  isBreaking: boolean
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string | null
  ogImageUrl: string | null
  targetKeyword: string | null
  readingTimeMinutes: number
  wordCount: number
  viewCount: number
  shareCount: number
  publishedAt: string | Date | null
  createdAt: string | Date
  updatedAt: string | Date
}

export type ArticleVersion = {
  id: string
  articleId: string
  versionNumber: number
  title: string
  content: string
  excerpt: string | null
  editedBy: string
  editedByUserId: string | null
  editNote: string | null
  createdAt: string | Date
}

export type Comment = {
  id: string
  articleId: string
  authorName: string
  authorEmail: string
  content: string
  status: string // PENDING | APPROVED | REJECTED | SPAM
  parentId: string | null
  ipAddress: string | null
  createdAt: string | Date
}

export type Faq = {
  id: string
  question: string
  answer: string
  order: number
  isPublished: boolean
  createdAt: string | Date
  updatedAt: string | Date
}

export type Subscriber = {
  id: string
  email: string
  status: string // ACTIVE | UNSUBSCRIBED
  source: string | null
  subscribedAt: string | Date
  unsubscribedAt: string | Date | null
}

export type Profile = {
  id: string
  email: string
  fullName: string | null
  role: string // admin | editor | writer
  avatarUrl: string | null
  isActive: boolean
  lastLoginAt: string | Date | null
  createdAt: string | Date
  updatedAt: string | Date
}

// Composite types with relations (for queries that include relations)

export type ArticleWithCategory = Article & {
  category: Category
}

export type ArticleWithRelations = Article & {
  category: Category
  tags: Tag[]
  author?: Profile | null
}

export type ArticleVersionWithUser = ArticleVersion & {
  editedByUser?: Profile | null
}

export type ProfileWithCounts = Profile & {
  _count?: { articles: number }
}
