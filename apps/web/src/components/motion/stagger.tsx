"use client";

import { motion, useReducedMotion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";

import { BASE_TRANSITION, VIEWPORT } from "./presets";

type StaggerProps = {
  children: React.ReactNode;
  /** Delay between each child in seconds */
  staggerDelay?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Use page-load animate instead of whileInView */
  onLoad?: boolean;
};

const containerVariants = (stagger: number, onLoad: boolean) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger,
      ...(onLoad ? {} : {}),
    },
  },
});

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const itemVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

/**
 * Wraps a list of children in a stagger container.
 * Each direct child should be a <StaggerItem>.
 */
export function Stagger({
  children,
  staggerDelay = 0.06,
  className,
  style,
  onLoad = false,
}: StaggerProps) {
  const container = containerVariants(staggerDelay, onLoad);
  const viewportProps = onLoad
    ? { animate: "visible" }
    : { whileInView: "visible", viewport: VIEWPORT };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      {...viewportProps}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

type StaggerItemProps = HTMLMotionProps<"div"> & {
  children: React.ReactNode;
};

/** Must be a direct child of <Stagger>. Animates in with parent stagger. */
export function StaggerItem({ children, style, ...rest }: StaggerItemProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={reduced ? itemVariantsReduced : itemVariants}
      transition={BASE_TRANSITION}
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
