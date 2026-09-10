'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Plus,
  List,
  FileEdit,
  CheckCircle2,
  FolderTree,
  Tags,
  HelpCircle,
  MessageSquare,
  Mail,
  Settings,
  Users,
  UserCircle,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/lib/store/sidebar-store'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  /** When true, only active when pathname === href (no prefix match). */
  exact?: boolean
  /** Roles allowed to see this item. Default: all roles. */
  roles?: string[] // ['admin','editor','writer']
  /** Notification badge count (e.g. pending comments). */
  badge?: number
  /** Sub-menu items. When present, item is collapsible. */
  children?: NavItem[]
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

/**
 * Source of truth for the admin sidebar navigation.
 * Items with `roles` only show untuk role yang diizinkan.
 * Default (tanpa roles) → semua role bisa lihat.
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
      {
        label: 'Artikel',
        href: '/admin/articles',
        icon: FileText,
        children: [
          { label: 'Semua Artikel', href: '/admin/articles', icon: List },
          { label: 'Tambah Baru', href: '/admin/articles/new', icon: Plus, exact: true },
          { label: 'Draft', href: '/admin/articles?status=DRAFT', icon: FileEdit },
          { label: 'Published', href: '/admin/articles?status=PUBLISHED', icon: CheckCircle2 },
        ],
      },
      { label: 'Kategori', href: '/admin/categories', icon: FolderTree, roles: ['admin'] },
      { label: 'Tag', href: '/admin/tags', icon: Tags, roles: ['admin'] },
      { label: 'FAQ', href: '/admin/faq', icon: HelpCircle, roles: ['admin'] },
    ],
  },
  {
    title: 'Interaksi',
    items: [
      {
        label: 'Komentar',
        href: '/admin/comments',
        icon: MessageSquare,
        roles: ['admin', 'editor'],
        badge: 3, // pending count (static demo — bisa diganti fetch realtime nanti)
      },
      { label: 'Subscriber', href: '/admin/subscribers', icon: Mail, roles: ['admin'] },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { label: 'Akun', href: '/admin/users', icon: Users, roles: ['admin'] },
      { label: 'Profil Saya', href: '/admin/profile', icon: UserCircle },
      { label: 'Pengaturan', href: '/admin/settings', icon: Settings, roles: ['admin'] },
    ],
  },
]

/**
 * Resolve whether a nav item is active for the given pathname + search params.
 *
 * Rules:
 * - Item dengan `?` di href (e.g. `/admin/articles?status=DRAFT`):
 *   active hanya kalau base-path sama DAN semua query param di item.href
 *   ada & match di current URL.
 * - `/admin` and any `exact: true` item → only active on exact match.
 * - `/admin/articles` (list, tanpa query) → active on exact match OR
 *   /admin/articles/{id}/edit, tapi NOT on /admin/articles/new.
 * - Other items → active on exact match OR any sub-path.
 */
export function isItemActive(
  pathname: string,
  item: NavItem,
  search?: URLSearchParams | null,
): boolean {
  // strip query string dari pathname (current location)
  const path = pathname.split('?')[0]

  // Pisahkan item.href menjadi base path + query
  const [itemPath, itemQueryStr] = item.href.split('?')

  // Path exact match
  if (path === itemPath) {
    // Jika item tidak punya query constraint → match
    if (!itemQueryStr) {
      // Tapi jika item.exact dan ada search di current location, tidak match
      // (untuk avoid 'Semua Artikel' active saat di '/admin/articles?status=DRAFT')
      if (item.exact) return true
      // Untuk non-exact, jika item punya sibling dengan query constraint
      // (mis. 'Semua Artikel' vs 'Draft'/'Published'), kita anggap 'Semua Artikel'
      // active hanya jika tidak ada status query di current URL.
      // Cek apakah ada sibling dengan query — pakai heuristic: jika search
      // mengandung `status` param, berarti user sedang di filtered view →
      // 'Semua Artikel' (tanpa query) tidak active.
      if (search && search.get('status')) return false
      return true
    }
    // Item punya query constraint → semua item query params harus match
    if (!search) return false
    const itemParams = new URLSearchParams(itemQueryStr)
    for (const [k, v] of itemParams.entries()) {
      if (search.get(k) !== v) return false
    }
    return true
  }

  if (item.exact) return false

  // Items dengan query string (mis. /admin/articles?status=DRAFT) hanya active
  // pada exact path match (sudah di-handle di atas). Mereka TIDAK boleh match
  // sub-path.
  if (itemQueryStr) return false

  // The articles list page should NOT steal the "new" page's active state.
  if (itemPath === '/admin/articles') {
    return path.startsWith('/admin/articles/') && !path.startsWith('/admin/articles/new')
  }

  return path.startsWith(itemPath + '/')
}

/** Render a small badge bubble for `item.badge`. */
function BadgeBubble({ count, className }: { count: number; className?: string }) {
  if (!count || count <= 0) return null
  return (
    <span
      className={cn(
        'pointer-events-none flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-slate-950',
        className,
      )}
      aria-label={`${count} notifikasi`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

interface NavLinkProps {
  item: NavItem
  onNavigate?: () => void
  /** Override collapse state (fallback to store jika tidak di-pass). */
  isCollapsedOverride?: boolean
}

export function NavLink({ item, onNavigate, isCollapsedOverride }: NavLinkProps) {
  const pathname = usePathname() || '/admin'
  const search = useSearchParams()
  const store = useSidebarStore()
  const isCollapsed = isCollapsedOverride ?? store.isCollapsed
  const expandedMenus = store.expandedMenus
  const toggleSubMenu = store.toggleSubMenu
  const active = isItemActive(pathname, item, search)
  const Icon = item.icon
  const hasChildren = !!item.children && item.children.length > 0
  const isExpanded = expandedMenus.includes(item.href)

  // Build common className parts
  const baseLink = cn(
    'group relative flex items-center gap-3 rounded-md text-sm font-medium transition-colors -ml-px border-l-2',
    active
      ? 'border-amber-500 bg-amber-500/10 text-amber-300'
      : 'border-transparent text-slate-300 hover:bg-slate-800/80 hover:text-white',
    // collapsed vs expanded padding/sizing
    isCollapsed ? 'h-10 w-10 justify-center' : 'px-3 py-2',
  )

  // ----- Collapsed mode — icon only with tooltip -----
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            aria-label={item.label}
            className={baseLink}
          >
            <Icon
              className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                active ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200',
              )}
            />
            {item.badge ? <BadgeBubble count={item.badge} className="absolute -top-0.5 -right-0.5" /> : null}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-slate-900 text-slate-100 border-slate-700">
          {item.label}
          {item.badge ? <span className="ml-1 text-rose-400">({item.badge})</span> : null}
        </TooltipContent>
      </Tooltip>
    )
  }

  // ----- Expanded mode -----
  return (
    <div className="flex flex-col">
      {hasChildren ? (
        // Parent trigger — button toggle, not a link
        <button
          type="button"
          onClick={() => toggleSubMenu(item.href)}
          aria-current={active ? 'page' : undefined}
          aria-expanded={isExpanded}
          className={baseLink}
        >
          <Icon
            className={cn(
              'h-4 w-4 shrink-0 transition-colors',
              active ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200',
            )}
          />
          <span className="truncate">{item.label}</span>
          {item.badge ? <BadgeBubble count={item.badge} className="ml-1" /> : null}
          <ChevronDown
            className={cn(
              'ml-auto h-4 w-4 shrink-0 text-slate-500 transition-transform duration-300',
              isExpanded && 'rotate-180',
            )}
            aria-hidden
          />
        </button>
      ) : (
        <Link
          href={item.href}
          onClick={onNavigate}
          aria-current={active ? 'page' : undefined}
          className={baseLink}
        >
          <Icon
            className={cn(
              'h-4 w-4 shrink-0 transition-colors',
              active ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200',
            )}
          />
          <span className="truncate">{item.label}</span>
          {item.badge ? <BadgeBubble count={item.badge} className="ml-auto" /> : null}
        </Link>
      )}

      {/* Sub-menu children (expanded only) */}
      {hasChildren && isExpanded && (
        <div className="mt-1 ml-6 space-y-0.5 border-l border-slate-700/50 pl-3">
          {item.children!.map((child) => {
            const childActive = isItemActive(pathname, child, search)
            const ChildIcon = child.icon
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                aria-current={childActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] transition-colors',
                  childActive
                    ? 'bg-amber-500/10 text-amber-300'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200',
                )}
              >
                <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{child.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface SidebarNavProps {
  onNavigate?: () => void
  role?: string // admin | editor | writer
  /** Override collapse state (fallback to store jika tidak di-pass). */
  isCollapsedOverride?: boolean
  /** Pending comments count untuk badge di item Komentar (override static). */
  pendingCommentsCount?: number
}

export function SidebarNav({
  onNavigate,
  role = 'admin',
  isCollapsedOverride,
  pendingCommentsCount,
}: SidebarNavProps) {
  const store = useSidebarStore()
  const isCollapsed = isCollapsedOverride ?? store.isCollapsed

  // Override badge di item Komentar dengan dynamic pending count.
  const sectionsWithBadge = pendingCommentsCount !== undefined
    ? navSections.map((section) => ({
        ...section,
        items: section.items.map((item) =>
          item.href === '/admin/comments'
            ? { ...item, badge: pendingCommentsCount }
            : item,
        ),
      }))
    : navSections

  return (
    <nav aria-label="Admin navigasi" className={cn('flex flex-col gap-5 py-4', isCollapsed ? 'px-2' : 'px-3')}>
      {sectionsWithBadge.map((section, i) => {
        const visibleItems = section.items.filter(
          (item) => !item.roles || item.roles.includes(role),
        )
        if (visibleItems.length === 0) return null
        return (
          <div key={i} className="flex flex-col gap-1">
            {section.title && !isCollapsed && (
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {section.title}
              </div>
            )}
            {/* In collapsed mode, render a thin separator line instead of section title */}
            {section.title && isCollapsed && i > 0 && (
              <div className="mx-auto my-1 h-px w-6 bg-slate-800" aria-hidden />
            )}
            {visibleItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                onNavigate={onNavigate}
                isCollapsedOverride={isCollapsed}
              />
            ))}
          </div>
        )
      })}
    </nav>
  )
}
