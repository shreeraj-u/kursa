"use client";

import { motion, useReducedMotion } from "motion/react";

import { BASE_TRANSITION, VIEWPORT } from "./presets";

type SlideInProps = {
  children: React.ReactNode;
  direction?: "left" | "right";
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Slides children in from left or right on scroll entry.
 * Used for the two-column feature sections.
 */
export function SlideIn({ children, direction = "left", className, style }: SlideInProps) {
  const reduced = useReducedMotion();
  const xOffset = direction === "left" ? -32 : 32;

  return (
    <motion.div
      initial={{ opacity: 0, x: reduced ? 0 : xOffset }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={VIEWPORT}
      transition={BASE_TRANSITION}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}
