"use client";

import { motion, useReducedMotion } from "motion/react";

import { EASE_OUT_EXPO } from "./presets";

type AnimatedWordProps = {
  word: string;
  delay?: number;
  color?: string;
  className?: string;
};

/**
 * Animates a single word with a fade-up on page load.
 * Use inside a headline with multiple <AnimatedWord> siblings to get a
 * staggered word-by-word reveal. Each word is inline-block so line breaks
 * work naturally.
 */
export function AnimatedWord({ word, delay = 0, color, className }: AnimatedWordProps) {
  const reduced = useReducedMotion();

  return (
    <motion.span
      initial={{ opacity: 0, y: reduced ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT_EXPO, delay }}
      className={`inline-block ${className ?? ""}`}
      style={{ marginRight: "0.22em", color }}
    >
      {word}
    </motion.span>
  );
}
