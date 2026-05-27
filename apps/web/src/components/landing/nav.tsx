"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";

import { AnimatedButton } from "@/components/motion/animated-button";

export default function LandingNav() {
  const reduced = useReducedMotion();

  return (
    <motion.nav
      initial={{ opacity: 0, y: reduced ? 0 : -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-50 border-b border-[var(--line)] backdrop-blur-sm"
      style={{ background: "color-mix(in srgb, var(--bg) 92%, transparent)" }}
    >
      <div className="mx-auto max-w-6xl px-6 flex items-center justify-between h-14">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-5 h-5 rounded-[4px] bg-[var(--ink)]" />
          <span
            className="font-semibold text-[var(--ink)] tracking-tight"
            style={{ fontSize: "var(--text-md)" }}
          >
            Kursa
          </span>
        </Link>

        {/* Center links */}
        <div className="hidden md:flex items-center gap-7">
          {[
            { label: "how it works", href: "#how" },
            { label: "the product", href: "#features" },
            { label: "pricing", href: "#pricing" },
            { label: "faq", href: "#faq" },
          ].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
              style={{ fontSize: "var(--text-base)" }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Right CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
            style={{ fontSize: "var(--text-base)" }}
          >
            Log in
          </Link>
          <AnimatedButton href="/login" className="btn sm">
            Get started
          </AnimatedButton>
        </div>
      </div>
    </motion.nav>
  );
}
