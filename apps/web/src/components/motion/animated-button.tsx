"use client";

import { motion, useReducedMotion } from "motion/react";

import { SPRING_HOVER } from "./presets";

type AnimatedButtonProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  href?: string;
};

/**
 * Scale + tap animation wrapper for CTA links/buttons.
 * Renders as <a> when href is provided, otherwise <button>.
 */
export function AnimatedButton({ children, className, style, href }: AnimatedButtonProps) {
  const reduced = useReducedMotion();

  const motionProps = reduced
    ? {}
    : {
        whileHover: { scale: 1.015 },
        whileTap: { scale: 0.97 },
        transition: SPRING_HOVER,
      };

  if (href) {
    return (
      <motion.a href={href} className={className} style={style} {...motionProps}>
        {children}
      </motion.a>
    );
  }

  return (
    <motion.div className={className} style={style} {...motionProps}>
      {children}
    </motion.div>
  );
}
