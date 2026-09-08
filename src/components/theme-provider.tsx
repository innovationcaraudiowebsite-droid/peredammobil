'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

/**
 * ThemeProvider wrapper untuk portal front-end.
 *
 * - attribute="class"  → Tailwind v4 dark variant pakai `.dark`
 * - defaultTheme="light"
 * - enableSystem=false → user pilih manual via toggle (lebih predictable untuk portal berita)
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
