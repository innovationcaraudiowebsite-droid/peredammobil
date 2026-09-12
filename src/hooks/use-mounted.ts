'use client'

import { useSyncExternalStore } from 'react'

/**
 * Detect whether the component has mounted on the client.
 *
 * Returns `false` during SSR / first render, `true` after hydration.
 * Uses `useSyncExternalStore` (React idiomatic) untuk avoid hydration
 * mismatch dan trigger eslint rule `react-hooks/set-state-in-effect`.
 *
 * Pattern yang umum:
 * ```ts
 * const mounted = useMounted()
 * if (!mounted) return <Placeholder />
 * ```
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {}, // subscribe (no-op, tidak ada external store)
    () => true, // getSnapshot (client) — selalu true setelah mount
    () => false, // getServerSnapshot (SSR) — selalu false
  )
}
