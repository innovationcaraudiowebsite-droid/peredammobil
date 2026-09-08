'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Theme toggle (light/dark) untuk header portal.
 *
 * Mount-only render (avoid hydration mismatch) via mounted state.
 */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  if (!mounted) {
    // Placeholder untuk hindari hydration mismatch.
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Ganti tema"
        className="size-9"
        type="button"
        disabled
      >
        <Sun className="size-4" />
      </Button>
    )
  }

  const isDark = (resolvedTheme || theme) === 'dark'
  return (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
      title={isDark ? 'Mode terang' : 'Mode gelap'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="size-9"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
