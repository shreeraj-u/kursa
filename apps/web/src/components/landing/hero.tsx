"use client";

import { motion, useReducedMotion } from "motion/react";

import { Button } from "@kursa/ui/components/button";
import { AnimatedWord } from "@/components/motion/animated-word";
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
    <header className="relative py-24 border-b border-[var(--line)] overflow-hidden">
      {/* Ambient gradient orbs */}
      {!reduced && (
        <>
          <motion.div
            className="absolute pointer-events-none select-none"
            style={{
              width: 700,
              height: 700,
              borderRadius: "50%",
              background: "radial-gradient(circle, var(--accent-soft) 0%, transparent 65%)",
              top: -260,
              left: -200,
            }}
            animate={{ x: [0, 60, 0], y: [0, 45, 0] }}
            transition={{ duration: 16, ease: "easeInOut", repeat: Infinity }}
          />
          <motion.div
            className="absolute pointer-events-none select-none"
            style={{
              width: 500,
              height: 500,
              borderRadius: "50%",
              background: "radial-gradient(circle, var(--accent-soft) 0%, transparent 65%)",
              bottom: -80,
              right: -80,
            }}
            animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
            transition={{ duration: 12, ease: "easeInOut", repeat: Infinity, delay: 4 }}
          />
        </>
      )}

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Copy — staggered page-load */}
          <div className="flex flex-col gap-5">
            <FadeChild delay={0} reduced={reduced}>
              <span className="chip live inline-flex">
                <span className="dot" />
                Beta Test
              </span>
            </FadeChild>

            {/* Word-level staggered headline */}
            <h1
              className="font-semibold leading-[1.05] tracking-tight"
              style={{ fontSize: "clamp(2.4rem, 5vw, 3.25rem)" }}
            >
              <span className="block">
                {["A", "career,", "designed."].map((word, i) => (
                  <AnimatedWord
                    key={word}
                    word={word}
                    delay={0.08 + i * 0.06}

                    color="var(--ink)"
                  />
                ))}
              </span>
              <span className="block">
                {["Not", "job-hunted."].map((word, i) => (
                  <AnimatedWord
                    key={word}
                    word={word}
                    delay={0.28 + i * 0.06}

                    color="var(--mute-2)"
                  />
                ))}
              </span>
            </h1>

            <FadeChild delay={0.42} reduced={reduced}>
              <p className="lede max-w-md">
                Kursa is an AI career operating system. It thinks alongside you between roles,
                during reviews, and across the years in between. One advisor. Your whole career.
              </p>
            </FadeChild>

            <FadeChild delay={0.5} reduced={reduced}>
              <div className="flex items-center gap-5 flex-wrap">
                <Button size="lg" render={<a href="/login" />} nativeButton={false}>
                  Get started — free
                </Button>
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
            transition={{ duration: 0.6, ease: EASE, delay: 0.5 }}
          >
            <HeroDashboardMock />
          </motion.div>
        </div>
      </div>
    </header>
  );
}
