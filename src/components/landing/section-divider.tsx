/**
 * SectionDivider — transisi visual antar section landing page.
 *
 * 2 mode:
 * - "wave": SVG wave shape untuk dark→light atau light→dark transition
 * - "line": gradient line tipis untuk light→light transition
 *
 * Props:
 * - variant: "wave-down" | "wave-up" | "line"
 *   - wave-down: dark section di atas, light section di bawah
 *   - wave-up: light section di atas, dark section di bawah
 *   - line: gradient line amber tipis
 */

interface SectionDividerProps {
  variant: "wave-down" | "wave-up" | "line"
  className?: string
}

export function SectionDivider({ variant, className = "" }: SectionDividerProps) {
  if (variant === "line") {
    return (
      <div
        className={`relative h-px w-full ${className}`}
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand/30 to-transparent" />
      </div>
    )
  }

  if (variant === "wave-down") {
    // Dark section di atas → light section di bawah
    // Wave di TOP of light section, fill = light bg
    return (
      <div
        className={`pointer-events-none relative h-[40px] w-full overflow-hidden ${className}`}
        aria-hidden
      >
        <svg
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <path
            d="M0,20 C240,0 480,40 720,20 C960,0 1200,40 1440,20 L1440,0 L0,0 Z"
            className="fill-slate-950"
          />
          <path
            d="M0,20 C240,0 480,40 720,20 C960,0 1200,40 1440,20 L1440,40 L0,40 Z"
            className="fill-muted/30"
          />
        </svg>
      </div>
    )
  }

  if (variant === "wave-up") {
    // Light section di atas → dark section di bawah
    // Wave di TOP of dark section, fill = dark bg
    return (
      <div
        className={`pointer-events-none relative h-[40px] w-full overflow-hidden ${className}`}
        aria-hidden
      >
        <svg
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <path
            d="M0,20 C240,40 480,0 720,20 C960,40 1200,0 1440,20 L1440,0 L0,0 Z"
            className="fill-muted/30"
          />
          <path
            d="M0,20 C240,40 480,0 720,20 C960,40 1200,0 1440,20 L1440,40 L0,40 Z"
            className="fill-slate-950"
          />
        </svg>
      </div>
    )
  }

  return null
}
