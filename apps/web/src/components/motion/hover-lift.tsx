"use client";

import { motion, useReducedMotion } from "motion/react";

import { SPRING_HOVER } from "./presets";

type HoverLiftProps = {
  children: React.ReactNode;
  /** How many px to lift on hover (negative y). Default: -4 */
  lift?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Lifts children upward on hover — used for cards and mock components.
 * Pairs well with existing border-based depth (no shadows needed).
 */
export function HoverLift({ children, lift = -4, className, style }: HoverLiftProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: lift }}
      transition={SPRING_HOVER}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}
