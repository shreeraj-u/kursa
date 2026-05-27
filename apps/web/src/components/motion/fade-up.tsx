"use client";

import { motion, useReducedMotion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";

import { BASE_TRANSITION, FADE_UP_VARIANTS, VIEWPORT } from "./presets";

type FadeUpProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children?: React.ReactNode;
  /** Extra delay in seconds before the animation starts */
  delay?: number;
  /**
   * Use page-load `animate` instead of `whileInView`.
   * Pass this for above-the-fold content (Hero, Nav).
   */
  immediate?: boolean;
};

/**
 * Wraps children in a fade-up animation.
 * Use `immediate` for above-the-fold content; otherwise fires on scroll entry.
 */
export function FadeUp({ delay = 0, immediate = false, children, ...rest }: FadeUpProps) {
  const reduced = useReducedMotion();
  const transition = { ...BASE_TRANSITION, delay };

  const animateProps = immediate
    ? {
        initial: reduced ? { opacity: 0 } : FADE_UP_VARIANTS.hidden,
        animate: reduced ? { opacity: 1 } : FADE_UP_VARIANTS.visible,
      }
    : {
        initial: reduced ? { opacity: 0 } : FADE_UP_VARIANTS.hidden,
        whileInView: reduced ? { opacity: 1 } : FADE_UP_VARIANTS.visible,
        viewport: VIEWPORT,
      };

  return (
    <motion.div {...animateProps} transition={transition} {...rest}>
      {children}
    </motion.div>
  );
}
