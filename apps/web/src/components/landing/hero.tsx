"use client";

import { motion, useReducedMotion } from "motion/react";

import { Button } from "@kursa/ui/components/button";
import { AnimatedWord } from "@/components/motion/animated-word";
import HeroDashboardMock from "@/components/mocks/hero-dashboard";

const EASE = [0.16, 1, 0.3, 1] as const;
const SIGNALS = ["profile memory", "journey reasoning", "resume tailoring", "journal intelligence"];

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
    <header className="relative min-h-[calc(100svh-3.5rem)] border-b border-[var(--line)] overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, color-mix(in srgb, var(--line) 60%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--line) 60%, transparent) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "linear-gradient(to bottom, black 0%, black 62%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-48 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, color-mix(in srgb, var(--surface) 72%, transparent), transparent)",
        }}
      />
      <div
        className="absolute left-1/2 top-16 h-px w-[min(1180px,calc(100vw-48px))] -translate-x-1/2 pointer-events-none"
        style={{ background: "linear-gradient(to right, transparent, var(--accent-line), transparent)" }}
      />

      <div className="relative mx-auto max-w-6xl px-6 py-14 sm:py-18 lg:px-8 lg:py-20">
        <div className="flex min-h-[calc(100svh-9.5rem)] flex-col items-center justify-center gap-10">
          <div className="mx-auto flex max-w-[960px] flex-col items-center gap-6 text-center">
            <FadeChild delay={0} reduced={reduced}>
              <span className="chip live inline-flex">
                <span className="dot" />
                Hackathon preview
              </span>
            </FadeChild>

            <h1
              className="max-w-[960px] font-semibold leading-[0.99] tracking-tighter"
              style={{ fontSize: "clamp(3rem, 6vw, 4.85rem)" }}
            >
              <span className="block">
                {["A", "career", "operating"].map((word, i) => (
                  <AnimatedWord
                    key={word}
                    word={word}
                    delay={0.08 + i * 0.06}
                    color="var(--ink)"
                  />
                ))}
              </span>
              <span className="block">
                {["system,"].map((word, i) => (
                  <AnimatedWord
                    key={word}
                    word={word}
                    delay={0.26 + i * 0.06}
                    color="var(--ink)"
                  />
                ))}
                {["not", "another", "job", "board."].map((word, i) => (
                  <AnimatedWord
                    key={word}
                    word={word}
                    delay={0.34 + i * 0.06}
                    color="var(--mute-2)"
                  />
                ))}
              </span>
            </h1>

            <FadeChild delay={0.42} reduced={reduced}>
              <p className="lede max-w-[760px]">
                Kursa is an AI career advisor with persistent memory. It turns your profile,
                journal, applications, and wins into specific next steps across the whole career.
              </p>
            </FadeChild>

            <FadeChild delay={0.5} reduced={reduced}>
              <div className="flex flex-col items-center gap-5">
                <div className="flex items-center justify-center gap-5 flex-wrap">
                  <Button size="lg" render={<a href="/login" />} nativeButton={false}>
                    Enter Kursa
                  </Button>
                  <a
                    href="#how"
                    className="flex items-center gap-1.5 text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
                    style={{ fontSize: "var(--text-base)" }}
                  >
                    See the demo flow <span aria-hidden>→</span>
                  </a>
                </div>
                <div className="grid max-w-xl grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center">
                  {SIGNALS.map((signal) => (
                    <span
                      key={signal}
                      className="mono rounded-md border border-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_72%,transparent)] px-3 py-2 text-[var(--mute)]"
                      style={{ fontSize: "var(--text-xs)" }}
                    >
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            </FadeChild>
          </div>

          <motion.div
            className="relative w-full max-w-[920px]"
            initial={{ opacity: 0, y: reduced ? 0 : 20, scale: reduced ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.5 }}
          >
            <div
              className="absolute -inset-3 rounded-[18px]"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--surface) 90%, transparent), color-mix(in srgb, var(--bg-sub) 86%, transparent))",
                border: "1px solid var(--line)",
                boxShadow: "0 28px 80px color-mix(in srgb, var(--ink) 10%, transparent)",
              }}
            />
            <div className="relative mx-auto">
              <HeroDashboardMock />
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
