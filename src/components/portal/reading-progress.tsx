'use client'

import { motion, useScroll, useSpring } from 'framer-motion'

/**
 * Reading progress bar — fixed at top of viewport, 3px height.
 * Width animates from 0% to 100% based on scroll position.
 * Used as a UX signal and indirect time-on-page signal for SEO.
 */
export function ReadingProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  return (
    <motion.div
      aria-hidden
      className="fixed left-0 right-0 top-0 z-50 h-[3px] origin-left bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600"
      style={{ scaleX }}
    />
  )
}
