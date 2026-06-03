/** Shared animation presets — keep durations fast and easing decisive. */

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const DURATION = {
  fast: 0.3,
  base: 0.45,
  slow: 0.6,
} as const;

/** Standard scroll-entry: fade + rise 20 px */
export const FADE_UP_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
} as const;

/** Viewport options: fire once, a little before fully in view */
export const VIEWPORT = { once: true, margin: "-60px 0px" } as const;

/** Default transition for most scroll entries */
export const BASE_TRANSITION = {
  duration: DURATION.base,
  ease: EASE_OUT_EXPO,
} as const;

/** Spring for hover / tap interactions */
export const SPRING_HOVER = {
  type: "spring" as const,
  stiffness: 350,
  damping: 25,
};
