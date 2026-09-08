import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import {
  SettingsForm,
  type SiteSettingData,
} from '@/components/admin/settings/settings-form'

export const metadata = {
  title: 'Pengaturan Situs — Admin Peredam Mobil Jakarta',
  description: 'Konfigurasi global portal (branding, kontak, social, newsletter).',
  robots: { index: false, follow: false },
}

export default async function SettingsPage() {
  await requireAdmin()

  // Singleton SiteSetting (id="global") — upsert default if missing.
  const setting = await db.siteSetting.upsert({
    where: { id: 'global' },
    update: {},
    create: { id: 'global' },
  })

  const initial: SiteSettingData = {
    siteName: setting.siteName,
    tagline: setting.tagline,
    logoUrl: setting.logoUrl,
    faviconUrl: setting.faviconUrl,
    primaryColor: setting.primaryColor,
    contactEmail: setting.contactEmail,
    contactAddress: setting.contactAddress,
    contactPhone: setting.contactPhone,
    socialFacebook: setting.socialFacebook,
    socialInstagram: setting.socialInstagram,
    socialYoutube: setting.socialYoutube,
    authorName: setting.authorName,
    newsletterHeadline: setting.newsletterHeadline,
    newsletterSubtext: setting.newsletterSubtext,
    footerCopyright: setting.footerCopyright,
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Pengaturan Situs
          </h1>
          <p className="text-sm text-muted-foreground">
            Konfigurasi global portal Peredam Mobil Jakarta. Perubahan langsung diterapkan ke
            front-end portal.
          </p>
        </div>
      </div>

      <SettingsForm initial={initial} />

      <div className="flex justify-start">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard
          </Link>
        </Button>
      </div>

      <SonnerToaster richColors position="top-right" />
    </div>
  )
}
