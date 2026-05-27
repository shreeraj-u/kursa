/**
 * Kursa logo system — faithful to the brand wordmark.
 *
 * Wordmark: "kursa" in Space Grotesk 600, near-black ink.
 * Mark:     a small diagonal ↗ arrow in accent green, superscript after the "a".
 *
 * Exports:
 *   <Logo />      — full wordmark + arrow mark
 *   <LogoMark />  — arrow-only icon (for favicons, small contexts)
 */

import { Space_Grotesk } from "next/font/google";

// ─── Font ─────────────────────────────────────────────────────────────────────

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
});

// ─── Sizes ────────────────────────────────────────────────────────────────────

const SIZES = {
  xs: { fontSize: 13,  arrow: 7  },
  sm: { fontSize: 17,  arrow: 9  },
  md: { fontSize: 22,  arrow: 11 },
  lg: { fontSize: 30,  arrow: 15 },
  xl: { fontSize: 44,  arrow: 22 },
} as const;

export type LogoSize = keyof typeof SIZES;

// ─── Arrow mark SVG ───────────────────────────────────────────────────────────

const ACCENT = "oklch(0.42 0.04 160)";

function ArrowMark({ size, color = ACCENT }: { size: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden
      style={{ display: "block", flexShrink: 0 }}
    >
      {/* Diagonal shaft */}
      <line
        x1="1.5" y1="8.5"
        x2="8.5" y2="1.5"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      {/* Arrowhead — top horizontal arm */}
      <line
        x1="3.5" y1="1.5"
        x2="8.5" y2="1.5"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      {/* Arrowhead — right vertical arm */}
      <line
        x1="8.5" y1="1.5"
        x2="8.5" y2="6.5"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

type LogoProps = {
  size?: LogoSize;
  /** Override ink colour (e.g. for light backgrounds) */
  color?: string;
  /** Override accent/arrow colour */
  accentColor?: string;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Full Kursa wordmark with accent arrow mark.
 * Inherits nothing from parent — colours are explicit via props or CSS vars.
 */
export function Logo({
  size = "md",
  color = "var(--ink)",
  accentColor = ACCENT,
  className,
  style,
}: LogoProps) {
  const { fontSize, arrow } = SIZES[size];

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "flex-start",
        lineHeight: 1,
        gap: 0,
        ...style,
      }}
    >
      {/* Wordmark */}
      <span
        className={spaceGrotesk.className}
        style={{
          fontSize,
          fontWeight: 600,
          color,
          letterSpacing: "-0.01em",
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        kursa
      </span>

      {/* Arrow — sits at the cap line, superscript-style */}
      <span
        aria-hidden
        style={{
          display: "inline-flex",
          alignItems: "flex-start",
          // Shift up so the arrow aligns to ~cap height
          marginTop: Math.round(fontSize * 0.04),
          marginLeft: Math.round(arrow * 0.15),
        }}
      >
        <ArrowMark size={arrow} color={accentColor} />
      </span>
    </span>
  );
}

// ─── LogoMark (arrow only) ────────────────────────────────────────────────────

type LogoMarkProps = {
  size?: LogoSize | number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
};

/** Standalone accent arrow — use in favicons, small badges, icon-only contexts. */
export function LogoMark({
  size = "md",
  color = ACCENT,
  className,
  style,
}: LogoMarkProps) {
  const px = typeof size === "number" ? size : SIZES[size].arrow * 2;
  return (
    <span className={className} style={{ display: "inline-flex", ...style }}>
      <ArrowMark size={px} color={color} />
    </span>
  );
}
