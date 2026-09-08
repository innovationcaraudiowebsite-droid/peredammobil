'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Plus,
  FolderTree,
  Tags,
  HelpCircle,
  MessageSquare,
  Mail,
  Settings,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  /** When true, only active when pathname === href (no prefix match). */
  exact?: boolean
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

/**
 * Source of truth for the admin sidebar navigation.
 * Future agents can import this list to render breadcrumbs, sitemap, etc.
 */
export const navSections: NavSection[] = [
  {
    items: [
      { label: 'Overview', href: '/admin', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    title: 'Konten',
    items: [
      { label: 'Semua Artikel', href: '/admin/articles', icon: FileText },
      { label: 'Tambah Artikel', href: '/admin/articles/new', icon: Plus, exact: true },
      { label: 'Kategori', href: '/admin/categories', icon: FolderTree },
      { label: 'Tag', href: '/admin/tags', icon: Tags },
      { label: 'FAQ', href: '/admin/faq', icon: HelpCircle },
    ],
  },
  {
    title: 'Interaksi',
    items: [
      { label: 'Komentar', href: '/admin/comments', icon: MessageSquare },
      { label: 'Subscriber', href: '/admin/subscribers', icon: Mail },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { label: 'Pengaturan', href: '/admin/settings', icon: Settings },
    ],
  },
]

/**
 * Resolve whether a nav item is active for the given pathname.
 *
 * Rules:
 * - `/admin` and any `exact: true` item → only active on exact match.
 * - `/admin/articles` (list) → active on exact match OR /admin/articles/{id}/edit
 *   but NOT on /admin/articles/new (that has its own nav entry).
 * - Other items → active on exact match OR any sub-path.
 */
export function isItemActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) return true
  if (item.exact) return false

  // The articles list page should NOT steal the "new" page's active state.
  if (item.href === '/admin/articles') {
    return (
      pathname.startsWith('/admin/articles/') &&
      !pathname.startsWith('/admin/articles/new')
    )
  }

  return pathname.startsWith(item.href + '/')
}

interface NavLinkProps {
  item: NavItem
  onNavigate?: () => void
}

export function NavLink({ item, onNavigate }: NavLinkProps) {
  const pathname = usePathname() || '/admin'
  const active = isItemActive(pathname, item)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        '-ml-px border-l-2',
        active
          ? 'border-amber-500 bg-amber-500/10 text-amber-300'
          : 'border-transparent text-slate-300 hover:bg-slate-800/80 hover:text-white',
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4 shrink-0 transition-colors',
          active ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200',
        )}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  )
}

interface SidebarNavProps {
  onNavigate?: () => void
}

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  return (
    <nav aria-label="Admin navigasi" className="flex flex-col gap-5 px-3 py-4">
      {navSections.map((section, i) => (
        <div key={i} className="flex flex-col gap-1">
          {section.title && (
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {section.title}
            </div>
          )}
          {section.items.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      ))}
    </nav>
  )
}
