"use client";

import { motion, useReducedMotion } from "motion/react";

import { AnimatedButton } from "@/components/motion/animated-button";
import HeroDashboardMock from "@/components/mocks/hero-dashboard";

const EASE = [0.16, 1, 0.3, 1] as const;

function FadeChild({
  children,
  delay,
  reduced,
}: {
  children: React.ReactNode;
  delay: number;
  reduced: boolean | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

export default function Hero() {
  const reduced = useReducedMotion();

  return (
    <header className="py-24 border-b border-[var(--line)]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Copy — staggered page-load */}
          <div className="flex flex-col gap-5">
            <FadeChild delay={0} reduced={reduced}>
              <span className="chip live inline-flex">
                <span className="dot" />
                Beta Test
              </span>
            </FadeChild>

            <FadeChild delay={0.08} reduced={reduced}>
              <h1
                className="font-semibold leading-[1.05] tracking-tight text-[var(--ink)]"
                style={{ fontSize: "clamp(2.4rem, 5vw, 3.25rem)" }}
              >
                A career, designed.
                <br />
                <em className="not-italic" style={{ color: "var(--mute-2)" }}>
                  Not job-hunted.
                </em>
              </h1>
            </FadeChild>

            <FadeChild delay={0.16} reduced={reduced}>
              <p className="lede max-w-md">
                Kursa is an AI career operating system. It thinks alongside you between roles,
                during reviews, and across the years in between. One advisor. Your whole career.
              </p>
            </FadeChild>

            <FadeChild delay={0.24} reduced={reduced}>
              <div className="flex items-center gap-5 flex-wrap">
                <AnimatedButton href="/login" className="btn lg">
                  Get started — free
                </AnimatedButton>
                <a
                  href="#how"
                  className="flex items-center gap-1.5 text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
                  style={{ fontSize: "var(--text-base)" }}
                >
                  See how it works <span aria-hidden>→</span>
                </a>
              </div>
            </FadeChild>
          </div>

          {/* Mock — delayed fade-in + subtle scale */}
          <motion.div
            className="hidden lg:block"
            initial={{ opacity: 0, y: reduced ? 0 : 20, scale: reduced ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.35 }}
          >
            <HeroDashboardMock />
          </motion.div>
        </div>
      </div>
    </header>
  );
}
