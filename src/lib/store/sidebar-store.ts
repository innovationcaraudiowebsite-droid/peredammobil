'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarState {
  /** Sidebar collapse state — `true` => narrow 72px (icon only), `false` => 256px expanded. */
  isCollapsed: boolean
  /** Mobile drawer open state (separate from desktop collapse). */
  isMobileOpen: boolean
  /** Sub-menu keys yang sedang expand (e.g. `['/admin/articles']`). */
  expandedMenus: string[]
  toggleCollapse: () => void
  setCollapsed: (v: boolean) => void
  toggleMobile: () => void
  setMobileOpen: (v: boolean) => void
  closeMobile: () => void
  toggleSubMenu: (key: string) => void
  setExpandedMenus: (keys: string[]) => void
}

/**
 * Sidebar UI state — collapse, mobile drawer, sub-menu expansion.
 * Persisted ke localStorage via `persist` middleware supaya preferensi
 * user bertahan antar session (default expanded 256px, expand Artikel sub-menu).
 */
export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      isMobileOpen: false,
      expandedMenus: ['/admin/articles'], // default expand "Artikel" sub-menu
      toggleCollapse: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
      setCollapsed: (v) => set({ isCollapsed: v }),
      toggleMobile: () => set((s) => ({ isMobileOpen: !s.isMobileOpen })),
      setMobileOpen: (v) => set({ isMobileOpen: v }),
      closeMobile: () => set({ isMobileOpen: false }),
      toggleSubMenu: (key) =>
        set((s) => ({
          expandedMenus: s.expandedMenus.includes(key)
            ? s.expandedMenus.filter((k) => k !== key)
            : [...s.expandedMenus, key],
        })),
      setExpandedMenus: (keys) => set({ expandedMenus: keys }),
    }),
    {
      name: 'admin-sidebar-state',
      // Hanya persist isCollapsed & expandedMenus — isMobileOpen selalu reset ke false
      partialize: (s) => ({
        isCollapsed: s.isCollapsed,
        expandedMenus: s.expandedMenus,
      }),
    },
  ),
)
