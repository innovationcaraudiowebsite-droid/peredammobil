import Link from 'next/link'
import { Mail, MapPin, Phone, Facebook, Instagram, Youtube, ArrowRight, ShieldCheck } from 'lucide-react'
import type { SiteSetting } from '@/lib/types'
import { NewsletterForm } from './newsletter-form'

/**
 * Footer sticky bottom — bg slate-950 text slate-300.
 * 4 kolom: About | Quick Links | Contact | Newsletter mini + copyright di bawah.
 */
export function Footer({ settings }: { settings: SiteSetting }) {
  const year = new Date().getFullYear()
  const quickLinks = [
    { href: '/kategori/peredam-mobil', label: 'Peredam Mobil' },
    { href: '/kategori/upgrade-audio', label: 'Upgrade Audio' },
    { href: '/kategori/review-workshop', label: 'Review Workshop' },
    { href: '/kategori/tips-biaya', label: 'Tips & Biaya' },
    { href: '/pencarian', label: 'Pencarian' },
    { href: '/admin/login', label: 'Masuk Admin' },
  ]

  return (
    <footer className="mt-auto bg-slate-950 text-slate-300 border-t border-slate-800">
      <div className="container mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.siteName}
                  className="h-8 w-auto"
                />
              ) : (
                <span className="inline-grid place-items-center size-9 rounded-md bg-amber-500 text-amber-950 font-bold">
                  PMJ
                </span>
              )}
              <span className="font-bold text-white text-lg">
                {settings.siteName}
              </span>
            </div>
            <p className="text-sm leading-6 text-slate-400">{settings.tagline}</p>
            <p className="mt-3 text-xs text-slate-500 inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" aria-hidden />
              Diupdate editorial setiap minggu sejak 2026
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-3 text-sm uppercase tracking-wide">
              Navigasi
            </h3>
            <ul className="space-y-2 text-sm">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-flex items-center gap-1.5 hover:text-amber-400 transition-colors"
                  >
                    <ArrowRight className="size-3 text-amber-500" aria-hidden />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-3 text-sm uppercase tracking-wide">
              Kontak
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="size-4 text-amber-500 mt-0.5 shrink-0" aria-hidden />
                <span className="text-slate-400">{settings.contactAddress}</span>
              </li>
              <li>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="inline-flex items-center gap-2.5 hover:text-amber-400 transition-colors"
                >
                  <Mail className="size-4 text-amber-500" aria-hidden />
                  <span className="text-slate-400">{settings.contactEmail}</span>
                </a>
              </li>
              {settings.contactPhone && (
                <li>
                  <a
                    href={`tel:${settings.contactPhone}`}
                    className="inline-flex items-center gap-2.5 hover:text-amber-400 transition-colors"
                  >
                    <Phone className="size-4 text-amber-500" aria-hidden />
                    <span className="text-slate-400">{settings.contactPhone}</span>
                  </a>
                </li>
              )}
            </ul>
            {/* Social */}
            {(settings.socialFacebook ||
              settings.socialInstagram ||
              settings.socialYoutube) && (
              <div className="mt-4 flex items-center gap-3">
                {settings.socialFacebook && (
                  <a
                    href={settings.socialFacebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="grid place-items-center size-8 rounded-full bg-slate-800 hover:bg-amber-500 hover:text-amber-950 transition-colors"
                  >
                    <Facebook className="size-4" />
                  </a>
                )}
                {settings.socialInstagram && (
                  <a
                    href={settings.socialInstagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="grid place-items-center size-8 rounded-full bg-slate-800 hover:bg-amber-500 hover:text-amber-950 transition-colors"
                  >
                    <Instagram className="size-4" />
                  </a>
                )}
                {settings.socialYoutube && (
                  <a
                    href={settings.socialYoutube}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                    className="grid place-items-center size-8 rounded-full bg-slate-800 hover:bg-amber-500 hover:text-amber-950 transition-colors"
                  >
                    <Youtube className="size-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Newsletter mini */}
          <div>
            <h3 className="font-semibold text-white mb-3 text-sm uppercase tracking-wide">
              {settings.newsletterHeadline || 'Buletin Mingguan'}
            </h3>
            <p className="text-sm text-slate-400 mb-3">
              {settings.newsletterSubtext ||
                'Ringkasan review workshop & panduan peredam, sekali seminggu.'}
            </p>
            <NewsletterForm
              variant="inline"
              headline={settings.newsletterHeadline || 'Buletin Mingguan'}
              subtext={settings.newsletterSubtext || ''}
            />
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
          <p>
            {settings.footerCopyright ||
              `© ${year} ${settings.siteName}. Seluruh hak cipta dilindungi.`}
          </p>
          <p className="text-slate-600">
            Dibangun dengan Next.js · Tailwind CSS · Supabase
          </p>
        </div>
      </div>
    </footer>
  )
}
