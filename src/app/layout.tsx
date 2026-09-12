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
const TAGLINE_FALLBACK = "Spesialis Peredam Mobil & Audio Car Jakarta Jabodetabek";

const DESCRIPTION =
  "Jasa peredam mobil Jakarta terpercaya sejak 2015. Workshop Innovation Car Audio spesialis peredam pintu, lantai, kap mesin & upgrade audio mobil. Melayani Jabodetabek. Material premium, garansi resmi, harga terbaik.";

const KEYWORDS = [
  // === Keyword Utama ===
  "soundproofing mobil",
  "peredam mobil jakarta",
  "jasa peredam mobil jakarta",
  "workshop peredam mobil jakarta",
  "peredam mobil jabodetabek",
  "jasa peredam suara mobil",
  "soundproofing mobil jakarta",
  "peredam suara mobil jakarta",
  "peredam kabin mobil jakarta",
  "peredam kabin mobil",
  // === Keyword Per Bagian Mobil ===
  "peredam pintu mobil jakarta",
  "peredam pintu mobil",
  "peredam lantai mobil",
  "peredam plafon mobil",
  "peredam kap mesin mobil",
  "peredam bagasi mobil",
  "peredam roda mobil",
  "peredam fender mobil",
  "peredam dashboard mobil",
  "peredam kolong mobil",
  "peredam getaran mobil",
  "peredam panas mobil",
  "peredam suara ban mobil",
  "peredam suara mesin mobil",
  "peredam suara jalan mobil",
  "peredam noise mobil",
  "peredam NVH mobil",
  // === Keyword Inggris ===
  "car soundproofing jakarta",
  "automotive soundproofing jakarta",
  "sound deadening mobil jakarta",
  "sound deadening mobil",
  // === Keyword Material ===
  "peredam butyl jakarta",
  "peredam butyl mobil",
  "butyl sound deadening mobil",
  "material peredam mobil",
  "bahan peredam mobil",
  // === Keyword Jasa & Biaya ===
  "pasang peredam mobil",
  "pemasangan peredam mobil",
  "biaya pasang peredam mobil",
  "harga peredam mobil jakarta",
  "harga pasang peredam mobil",
  "paket peredam mobil jakarta",
  "paket soundproofing mobil",
  "paket peredam pintu mobil",
  "paket peredam kabin mobil",
  "full peredam mobil",
  "full soundproofing mobil",
  "peredam mobil terbaik jakarta",
  "peredam mobil berkualitas jakarta",
  "workshop soundproofing mobil",
  "spesialis peredam mobil jakarta",
  // === Keyword Lokasi Jakarta ===
  "peredam mobil jakarta selatan",
  "peredam mobil jakarta barat",
  "peredam mobil jakarta timur",
  "peredam mobil jakarta utara",
  "peredam mobil jakarta pusat",
  "jasa peredam mobil jakarta selatan",
  "jasa peredam mobil jakarta barat",
  "jasa peredam mobil jakarta timur",
  "jasa peredam mobil jakarta utara",
  "jasa peredam mobil jakarta pusat",
  "workshop peredam mobil jakarta selatan",
  "workshop peredam mobil jakarta barat",
  "workshop peredam mobil jakarta timur",
  "workshop peredam mobil jakarta utara",
  "workshop peredam mobil jakarta pusat",
  // === Keyword Lokasi Bodetabek ===
  "peredam mobil tangerang",
  "jasa peredam mobil tangerang",
  "workshop peredam mobil tangerang",
  "peredam mobil bekasi",
  "jasa peredam mobil bekasi",
  "workshop peredam mobil bekasi",
  "peredam mobil depok",
  "jasa peredam mobil depok",
  "workshop peredam mobil depok",
  "peredam mobil bogor",
  "jasa peredam mobil bogor",
  "workshop peredam mobil bogor",
  "peredam mobil bintaro",
  "peredam mobil bsd",
  "peredam mobil cibubur",
  // === Keyword Audio Mobil ===
  "audio mobil jakarta",
  "upgrade audio mobil jakarta",
  "audio car jakarta",
  "workshop audio mobil jakarta",
  "bengkel audio mobil jakarta",
  "spesialis audio mobil jakarta",
  "instalasi audio mobil jakarta",
  "jasa audio mobil jakarta",
  "upgrade sound system mobil",
  "upgrade audio mobil",
  "upgrade sound mobil",
  "audio mobil terbaik jakarta",
  "audio mobil premium jakarta",
  "audio mobil SQ jakarta",
  "audio mobil SPL jakarta",
  "audio mobil OEM upgrade",
  "audio mobil harian jakarta",
  "custom audio mobil jakarta",
  "custom audio car jakarta",
  "tuning audio mobil jakarta",
  "setting audio mobil jakarta",
  "instalasi speaker mobil jakarta",
  "speaker mobil jakarta",
  "speaker aftermarket mobil",
  "speaker mobil terbaik jakarta",
  "speaker 2 way mobil",
  "speaker 3 way mobil",
  "tweeter mobil jakarta",
  "subwoofer mobil jakarta",
  "subwoofer aktif mobil jakarta",
  "subwoofer kolong mobil",
  "amplifier mobil jakarta",
  "power amplifier mobil",
  "DSP mobil jakarta",
  "DSP audio mobil",
  "tuning DSP mobil jakarta",
  "processor audio mobil jakarta",
  "head unit mobil jakarta",
  "upgrade head unit mobil",
  "audio system mobil jakarta",
  // === Keyword Kombinasi Peredam + Audio ===
  "peredam mobil untuk audio",
  "peredam mobil untuk sound system",
  "peredam pintu untuk speaker mobil",
  "peredam pintu sebelum pasang speaker",
  "peredam mobil dan upgrade audio",
  "paket peredam dan audio mobil",
  "paket soundproofing dan audio mobil",
  "upgrade audio dan peredam mobil",
  "peredam kabin untuk audio mobil",
  "peredam pintu dan speaker mobil",
  "peredam mobil SQ",
  "peredam untuk kualitas audio mobil",
  "soundproofing untuk audio mobil",
  "peredam mobil agar suara lebih jernih",
  "peredam mobil agar bass lebih maksimal",
  "peredam pintu agar bass speaker lebih bagus",
  "upgrade audio mobil plus peredam",
  "full peredam dan audio mobil",
  "paket audio mobil dan soundproofing",
  "spesialis peredam dan audio mobil jakarta",
  // === Brand ===
  "innovation car audio",
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
  // Use production URL for OG/canonical (VERCEL_URL is preview-specific)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://peredammobil.vercel.app")
  const ogImage = "/og-default.png"

  return {
    metadataBase: new URL(siteUrl),
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
      url: siteUrl,
      siteName: s.siteName,
      title,
      description: DESCRIPTION,
      images: [
        {
          url: ogImage,
          secureUrl: ogImage,
          width: 1200,
          height: 630,
          alt: s.siteName,
          type: "image/png",
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
