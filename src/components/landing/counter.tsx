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
 * Uses framer-motion's `useInView` for scroll-trigger detection.
 *
 * Example:
 *   <Counter value={10} suffix="+" />
 *   <Counter value={1000} suffix="+" useComma />
 *   <Counter value={4.9} decimals={1} suffix="★" />
 *   <Counter value={100} suffix="%" />
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
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (!isInView) return

    let startTime: number | null = null
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)

      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = eased * value

      setDisplayValue(current)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        setDisplayValue(value) // Ensure exact final value
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
    }
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
