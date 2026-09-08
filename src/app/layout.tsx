import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { db } from "@/lib/db";

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
const TAGLINE_FALLBACK =
  "Review Workshop Peredam & Upgrade Audio Terbaik";

export async function generateMetadata(): Promise<Metadata> {
  let siteName = SITE_NAME_FALLBACK;
  let tagline = TAGLINE_FALLBACK;
  let logoUrl: string | null = null;
  let faviconUrl: string | null = null;

  try {
    const s = await db.siteSetting.upsert({
      where: { id: "global" },
      update: {},
      create: {},
    });
    siteName = s.siteName || siteName;
    tagline = s.tagline || tagline;
    logoUrl = s.logoUrl ?? null;
    faviconUrl = s.faviconUrl ?? null;
  } catch {
    // DB belum siap → pakai fallback.
  }

  const title = `${siteName} — ${tagline}`;
  const description =
    "Portal media niche otomotif yang membahas peredam mobil, upgrade audio, review workshop Jakarta, tips & biaya pemasangan. Panduan teknis berbasis pengalaman nyata di kabin mobil harian Jakarta.";
  const keywords = [
    "peredam mobil",
    "peredam mobil jakarta",
    "upgrade audio mobil",
    "workshop peredam jakarta",
    "butyl peredam",
    "speaker split",
    "DSP mobil",
    "biaya pasang peredam",
    "review workshop jakarta",
    siteName,
  ];

  return {
    title: {
      default: title,
      template: `%s — ${siteName}`,
    },
    description,
    keywords,
    authors: [{ name: siteName }],
    applicationName: siteName,
    icons: {
      icon: faviconUrl || "/favicon.ico",
      apple: faviconUrl || undefined,
    },
    openGraph: {
      title,
      description,
      siteName,
      type: "website",
      locale: "id_ID",
      images: logoUrl ? [{ url: logoUrl, alt: siteName }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: logoUrl ? [logoUrl] : undefined,
    },
    robots: { index: true, follow: true },
    alternates: { canonical: "/" },
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
          <Toaster />
          <Sonner position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
