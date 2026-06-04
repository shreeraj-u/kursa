"use client";

import { motion, useReducedMotion } from "motion/react";

import { Button } from "@kursa/ui/components/button";
import { FadeUp } from "@/components/motion/fade-up";
import { HoverLift } from "@/components/motion/hover-lift";
import { Stagger, StaggerItem } from "@/components/motion/stagger";

const TIERS = [
  {
    tag: "free", pop: false,
    name: "Open",
    pos: "Enough to feel what it does. No credit card.",
    vol: "3", unit: "path scenarios / month",
    cost: "$0 forever",
    bullets: [
      "Full career map · 3 scenarios",
      "Skills profile, no expiry",
      "10 messages / day with Aria",
      "1 résumé version",
    ],
    cta: "Enter demo",
  },
  {
    tag: "standard", pop: true,
    name: "Member",
    pos: "For the person actually planning a career, not just looking for a job.",
    vol: "∞", unit: "path scenarios · unlimited",
    cost: "$24 / month · billed yearly",
    bullets: [
      "Everything in Open",
      "Unlimited Aria conversations with memory",
      "Tailored shortlist · refreshed weekly",
      "Unlimited résumé versions + tailoring",
      "Career journal · post-placement",
    ],
    cta: "Preview Member",
  },
  {
    tag: "intensive", pop: false,
    name: "In-search",
    pos: "For the laid-off, the OPT-clocked, the people who need this to work in the next 90 days.",
    vol: "50", unit: "tailored applications / month",
    cost: "$59 / month · cancel anytime",
    bullets: [
      "Everything in Member",
      "Same-day shortlist refresh",
      "Per-application tailoring at depth",
      "Practice interviews with Aria",
      "Priority human review on flagged drafts",
    ],
    cta: "Preview In-search",
  },
];

const REASSURANCES = [
  "Cancel anytime",
  "Free tier never expires",
  "Your data is portable on day one",
];

function PopularCardInner({ t }: { t: (typeof TIERS)[number] }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className="rounded-xl p-7 flex flex-col h-full"
      style={{
        border: "1.5px solid var(--ink)",
        background: "linear-gradient(155deg, var(--surface) 55%, oklch(0.42 0.04 160 / 0.04) 100%)",
      }}
      animate={
        reduced
          ? {}
          : {
              boxShadow: [
                "0 0 0 0 transparent",
                "0 0 28px 4px oklch(0.42 0.04 160 / 0.13)",
                "0 0 0 0 transparent",
              ],
            }
      }
      transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, delay: 1.5 }}
    >
      <CardContents t={t} />
    </motion.div>
  );
}

function CardContents({ t }: { t: (typeof TIERS)[number] }) {
  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <span className="eyebrow mono">{t.tag}</span>
        {t.pop && (
          <span className="chip good">
            <span className="dot" />
            most chosen
          </span>
        )}
      </div>

      <h3
        className="font-semibold text-[var(--ink)] mb-2"
        style={{ fontSize: "var(--text-xl)" }}
      >
        {t.name}
      </h3>
      <p
        className="leading-relaxed mb-5"
        style={{ fontSize: "var(--text-sm)", color: "var(--mute)" }}
      >
        {t.pos}
      </p>

      <div className="mb-1 flex items-baseline gap-1.5">
        <span
          className="font-semibold text-[var(--ink)] tracking-tight"
          style={{ fontSize: "2.5rem" }}
        >
          {t.vol}
        </span>
        <span className="meta-text">{t.unit}</span>
      </div>
      <div className="mono mb-6" style={{ fontSize: "var(--text-xs)", color: "var(--mute)" }}>
        {t.cost}
      </div>

      <ul className="flex flex-col gap-2 mb-8 flex-1">
        {t.bullets.map((b) => (
          <li
            key={b}
            className="flex items-start gap-2"
            style={{ fontSize: "var(--text-sm)", color: "var(--mute)" }}
          >
            <span style={{ color: "var(--accent)", marginTop: 2, flexShrink: 0 }}>·</span>
            {b}
          </li>
        ))}
      </ul>

      <Button
        size="lg"
        variant={t.pop ? "default" : "outline"}
        className="w-full"
        render={<a href="/login" />}
        nativeButton={false}
      >
        {t.cta}
      </Button>
    </>
  );
}

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 border-b border-[var(--line)]">
      <div className="mx-auto max-w-6xl px-6">
        <FadeUp>
          <div className="eyebrow mono mb-3">
            <span style={{ color: "var(--mute-3)" }}>·</span> pricing
          </div>
          <h2
            className="font-semibold tracking-tight text-[var(--ink)] mb-4"
            style={{ fontSize: "var(--text-3xl)" }}
          >
            Pay for the relationship. Not the form fields.
          </h2>
          <p className="lede mb-14 max-w-2xl">
            For the hackathon preview, the important part is not checkout — it is the relationship:
            persistent memory, sharper advice, and career context that compounds over time.
          </p>
        </FadeUp>

        <Stagger staggerDelay={0.08} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TIERS.map((t) => (
            <StaggerItem key={t.tag}>
              <HoverLift lift={t.pop ? -8 : -5} className="h-full">
                {t.pop ? (
                  <PopularCardInner t={t} />
                ) : (
                  <div
                    className="rounded-xl p-7 flex flex-col h-full"
                    style={{
                      border: "1px solid var(--line)",
                      background: "var(--surface)",
                    }}
                  >
                    <CardContents t={t} />
                  </div>
                )}
              </HoverLift>
            </StaggerItem>
          ))}
        </Stagger>

        <FadeUp>
          <div className="flex items-center gap-8 mt-10 flex-wrap">
            {REASSURANCES.map((r) => (
              <span key={r} className="eyebrow mono flex items-center gap-1.5">
                <span style={{ color: "var(--accent)" }}>·</span>
                {r}
              </span>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
