import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { db } from "@/lib/db";
import {
  JsonLd,
  OrganizationSchema,
  WebSiteSchema,
  LocalBusinessSchema,
} from "@/components/seo/json-ld";
import { Analytics } from "@/components/seo/analytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Default fallback metadata — akan di-override oleh generateMetadata di bawah.
const SITE_NAME_FALLBACK = "Peredam Mobil Jakarta";
const TAGLINE_FALLBACK = "Review Workshop Peredam & Upgrade Audio Terbaik";

const DESCRIPTION =
  "Portal media niche otomotif yang membahas peredam mobil, upgrade audio, review workshop Jakarta, tips & biaya pemasangan. Panduan teknis berbasis pengalaman nyata di kabin mobil harian Jakarta.";

const KEYWORDS = [
  "peredam mobil jakarta",
  "peredam mobil",
  "upgrade audio mobil",
  "workshop peredam jakarta",
  "butyl peredam",
  "speaker split",
  "DSP mobil",
  "biaya pasang peredam",
  "review workshop jakarta",
  "peredam pintu mobil",
];

type SiteSettingLite = {
  siteName: string
  tagline: string
  logoUrl: string | null
  faviconUrl: string | null
  gaMeasurementId: string | null
  gtmId: string | null
  verificationGoogle: string | null
  verificationBing: string | null
}

async function getSettings(): Promise<SiteSettingLite> {
  const fallback: SiteSettingLite = {
    siteName: SITE_NAME_FALLBACK,
    tagline: TAGLINE_FALLBACK,
    logoUrl: null,
    faviconUrl: null,
    gaMeasurementId: null,
    gtmId: null,
    verificationGoogle: null,
    verificationBing: null,
  }
  try {
    const s = (await db.siteSetting.upsert({
      where: { id: "global" },
      update: {},
      create: {},
    })) as {
      siteName?: string | null
      tagline?: string | null
      logoUrl?: string | null
      faviconUrl?: string | null
      gaMeasurementId?: string | null
      gtmId?: string | null
      verificationGoogle?: string | null
      verificationBing?: string | null
    }
    return {
      siteName: s.siteName || fallback.siteName,
      tagline: s.tagline || fallback.tagline,
      logoUrl: s.logoUrl ?? null,
      faviconUrl: s.faviconUrl ?? null,
      gaMeasurementId: s.gaMeasurementId ?? null,
      gtmId: s.gtmId ?? null,
      verificationGoogle: s.verificationGoogle ?? null,
      verificationBing: s.verificationBing ?? null,
    }
  } catch {
    return fallback
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings()
  const title = `${s.siteName} — ${s.tagline}`
  const ogImage = "/og-default.png"

  return {
    metadataBase: new URL("https://peredammobiljakarta.com"),
    title: {
      default: title,
      template: `%s — ${s.siteName}`,
    },
    description: DESCRIPTION,
    keywords: KEYWORDS,
    authors: [{ name: "Innovation Car Audio" }],
    creator: "Innovation Car Audio",
    publisher: "Innovation Car Audio",
    applicationName: s.siteName,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    alternates: {
      canonical: "/",
      types: {
        "application/rss+xml": "/rss.xml",
      },
    },
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: "https://peredammobiljakarta.com",
      siteName: s.siteName,
      title,
      description: DESCRIPTION,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: s.siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: DESCRIPTION,
      images: [ogImage],
    },
    icons: {
      icon: s.faviconUrl || "/favicon.ico",
      apple: s.faviconUrl || "/apple-touch-icon.png",
    },
    manifest: "/manifest.webmanifest",
    category: "automotive",
    // Bing & Google verification meta are added via `other` if present.
    other: {
      ...(s.verificationGoogle
        ? { "google-site-verification": s.verificationGoogle }
        : {}),
      ...(s.verificationBing
        ? { "msvalidate.01": s.verificationBing }
        : {}),
    },
  };
}

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f59e0b" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const s = await getSettings();
  // Build root JSON-LD (Organization + WebSite + LocalBusiness).
  const [organization, website, localBusiness] = await Promise.all([
    OrganizationSchema(),
    WebSiteSchema(),
    LocalBusinessSchema(),
  ]);

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* JSON-LD for Organization, WebSite, LocalBusiness sitewide. */}
        <JsonLd schema={organization} />
        <JsonLd schema={website} />
        <JsonLd schema={localBusiness} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
          <Toaster />
          <Sonner position="top-center" richColors closeButton />
        </ThemeProvider>

        {/* Google Analytics 4 + Tag Manager (only when configured). */}
        <Analytics
          gaMeasurementId={s.gaMeasurementId}
          gtmId={s.gtmId}
        />
      </body>
    </html>
  );
}
