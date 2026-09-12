'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

interface CounterProps {
  /** Target value to count up to */
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
 * Animated counter — counts up from 0 to `value` when section enters viewport.
 *
 * IMPORTANT: SSR renders the TARGET value (not 0) so crawlers and users
 * see the correct number immediately. The animation only runs in browser
 * when the element scrolls into view.
 *
 * Uses framer-motion's `useInView` for scroll-trigger detection.
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
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  // SSR & initial: show target value (not 0)
  const [displayValue, setDisplayValue] = useState(value)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    if (!isInView || hasAnimated) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasAnimated(true)

    // Start animation from 0 (inside rAF callback = async, not synchronous)
    let startTime: number | null = null
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp
      }
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(eased * value)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        setDisplayValue(value)
      }
    }

    // Start from 0
    setDisplayValue(0)
    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
    }
  }, [isInView, value, duration, hasAnimated])

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
