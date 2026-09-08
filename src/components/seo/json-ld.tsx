import { db } from '@/lib/db'

/**
 * JSON-LD schema components for SEO.
 *
 * All schemas are rendered as inline <script type="application/ld+json">.
 * Used by Google to enable rich results (Organization, FAQ, Breadcrumb,
 * Article, LocalBusiness, WebSite, WebPage).
 *
 * Server components only — these helpers build plain JS objects.
 */

const BASE_URL = 'https://peredammobiljakarta.com'

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

type JsonLdObject = Record<string, unknown>

/**
 * Wrap a single schema object in a <script type="application/ld+json"> tag.
 * Escapes "<" so it stays safe inside HTML.
 */
export function JsonLd({ schema }: { schema: JsonLdObject | JsonLdObject[] }) {
  const html = JSON.stringify(schema).replace(/</g, '\\u003c')
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/* -------------------------------------------------------------------------- */
/*  Organization                                                               */
/* -------------------------------------------------------------------------- */

export async function OrganizationSchema(): Promise<JsonLdObject> {
  let logoUrl: string | null = null
  let siteName = 'Peredam Mobil Jakarta'
  try {
    const s = await db.siteSetting.upsert({
      where: { id: 'global' },
      update: {},
      create: {},
    })
    siteName = s.siteName || siteName
    logoUrl = s.logoUrl
  } catch {
    // ignore
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: BASE_URL,
    logo: logoUrl
      ? {
          '@type': 'ImageObject',
          url: logoUrl.startsWith('http') ? logoUrl : `${BASE_URL}${logoUrl}`,
        }
      : undefined,
    description:
      'Portal media niche otomotif yang membahas peredam mobil, upgrade audio, review workshop Jakarta.',
    sameAs: ['https://peredammobiljakarta.com'],
  }
}

/* -------------------------------------------------------------------------- */
/*  WebSite with SearchAction                                                  */
/* -------------------------------------------------------------------------- */

export async function WebSiteSchema(): Promise<JsonLdObject> {
  let siteName = 'Peredam Mobil Jakarta'
  try {
    const s = await db.siteSetting.upsert({
      where: { id: 'global' },
      update: {},
      create: {},
    })
    siteName = s.siteName || siteName
  } catch {
    // ignore
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: BASE_URL,
    inLanguage: 'id-ID',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/pencarian?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/* -------------------------------------------------------------------------- */
/*  LocalBusiness (Innovation Car Audio, Kalideres Jakarta)                    */
/* -------------------------------------------------------------------------- */

export async function LocalBusinessSchema(): Promise<JsonLdObject> {
  let address =
    'Jl. Taman Surya Boulevard 3 Blok H1 No.9, Pegadungan, Kalideres, Jakarta Barat 11830'
  let email = 'innovationcaraudio@gmail.com'
  let phone: string | null = null
  let name = 'Innovation Car Audio'

  try {
    const s = await db.siteSetting.upsert({
      where: { id: 'global' },
      update: {},
      create: {},
    })
    address = s.contactAddress || address
    email = s.contactEmail || email
    phone = s.contactPhone
    name = s.authorName || name
  } catch {
    // ignore
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'AutomotiveBusiness',
    name,
    image: `${BASE_URL}/og-default.png`,
    url: BASE_URL,
    telephone: phone || undefined,
    email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address,
      addressLocality: 'Jakarta Barat',
      addressRegion: 'DKI Jakarta',
      postalCode: '11830',
      addressCountry: 'ID',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -6.1541,
      longitude: 106.7272,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '09:00',
        closes: '16:00',
      },
    ],
    priceRange: '$$',
  }
}

/* -------------------------------------------------------------------------- */
/*  BreadcrumbList                                                             */
/* -------------------------------------------------------------------------- */

export type BreadcrumbItem = {
  name: string
  /** Path relative to base URL, or absolute URL. */
  url?: string
}

export function BreadcrumbListSchema(items: BreadcrumbItem[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url
        ? it.url.startsWith('http')
          ? it.url
          : `${BASE_URL}${it.url}`
        : undefined,
    })),
  }
}

/* -------------------------------------------------------------------------- */
/*  NewsArticle / Article                                                      */
/* -------------------------------------------------------------------------- */

export interface ArticleSchemaInput {
  title: string
  excerpt: string | null
  metaDescription: string | null
  featuredImageUrl: string | null
  ogImageUrl: string | null
  publishedAt: Date | null
  updatedAt: Date
  authorName: string
  siteName: string
  siteLogoUrl: string | null
  categorySlug: string
  categoryName: string
  articleSlug: string
  tagNames: string[]
  wordCount: number
  contentMarkdown: string | null
}

export function ArticleSchema(input: ArticleSchemaInput): JsonLdObject {
  const url = `${BASE_URL}/berita/${input.categorySlug}/${input.articleSlug}`
  const image = input.ogImageUrl || input.featuredImageUrl
  const description =
    input.metaDescription || input.excerpt || undefined
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: input.title,
    description,
    image: image ? [image.startsWith('http') ? image : `${BASE_URL}${image}`] : undefined,
    datePublished: input.publishedAt?.toISOString(),
    dateModified: input.updatedAt?.toISOString(),
    author: {
      '@type': 'Organization',
      name: input.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: input.siteName,
      logo: input.siteLogoUrl
        ? {
            '@type': 'ImageObject',
            url: input.siteLogoUrl.startsWith('http')
              ? input.siteLogoUrl
              : `${BASE_URL}${input.siteLogoUrl}`,
          }
        : undefined,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    articleSection: input.categoryName,
    keywords: input.tagNames.join(', '),
    wordCount: input.wordCount,
    articleBody: input.contentMarkdown || undefined,
    url,
  }
}

/* -------------------------------------------------------------------------- */
/*  FAQPage                                                                    */
/* -------------------------------------------------------------------------- */

export function FAQPageSchema(
  faqs: { question: string; answer: string }[],
): JsonLdObject | null {
  if (!faqs.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  }
}

/* -------------------------------------------------------------------------- */
/*  WebPage (with optional speakable selector)                                 */
/* -------------------------------------------------------------------------- */

export function WebPageSchema(input: {
  name: string
  description?: string
  url: string
  speakableSelectors?: string[]
}): JsonLdObject {
  const url = input.url.startsWith('http')
    ? input.url
    : `${BASE_URL}${input.url}`
  const schema: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: input.name,
    description: input.description,
    url,
    inLanguage: 'id-ID',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Peredam Mobil Jakarta',
      url: BASE_URL,
    },
  }
  if (input.speakableSelectors && input.speakableSelectors.length) {
    schema.speakable = {
      '@type': 'SpeakableSpecification',
      cssSelector: input.speakableSelectors,
    }
  }
  return schema
}

/* -------------------------------------------------------------------------- */
/*  CollectionPage (for category listing)                                      */
/* -------------------------------------------------------------------------- */

export function CollectionPageSchema(input: {
  name: string
  description?: string
  url: string
  numberOfItems: number
}): JsonLdObject {
  const url = input.url.startsWith('http')
    ? input.url
    : `${BASE_URL}${input.url}`
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    description: input.description,
    url,
    inLanguage: 'id-ID',
    numberOfItems: input.numberOfItems,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Peredam Mobil Jakarta',
      url: BASE_URL,
    },
  }
}
