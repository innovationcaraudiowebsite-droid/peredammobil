'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView, animate } from 'framer-motion'

interface CounterProps {
  /** Target value to display */
  value: number
  /** Animation duration in seconds (default 2) */
  duration?: number
  /** Number of decimal places (default 0) */
  decimals?: number
  /** Prefix string (e.g., '★ ') */
  prefix?: string
  /** Suffix string (e.g., '+', '%', '★') */
  suffix?: string
  /** Use thousand separator (comma) — default false */
  useComma?: boolean
  /** Class name for the number */
  className?: string
}

/**
 * Animated counter.
 *
 * BEHAVIOR:
 * - SSR: renders the TARGET value immediately (SEO-friendly, no 0 flash)
 * - Client: renders the TARGET value on mount (matches SSR, no hydration error)
 * - When scrolled into view: animates from 0 to target via framer-motion's
 *   animate() function. The reset to 0 happens inside the animation's
 *   first frame (via requestAnimationFrame), so the browser has already
 *   painted the SSR value before the flash occurs.
 *
 * The key fix: we use framer-motion's `animate()` which handles the
 * timing internally, avoiding React state batching issues that caused
 * the counter to get stuck at 0.
 */
export function Counter({
  value,
  duration = 2,
  decimals = 0,
  prefix = '',
  suffix = '',
  useComma = false,
  className = '',
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  // SSR & initial client render: show target value
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    if (!isInView) return

    // Use framer-motion's animate() — handles rAF internally
    // Starts from 0, animates to target value
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1], // easeOutCubic
      onUpdate: (v) => setDisplayValue(v),
    })

    return () => controls.stop()
  }, [isInView, value, duration])

  const formatted = () => {
    const fixed = displayValue.toFixed(decimals)
    if (useComma) {
      const parts = fixed.split('.')
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      return parts.join('.')
    }
    return fixed
  }

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted()}
      {suffix}
    </span>
  )
}
