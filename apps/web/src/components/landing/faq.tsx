"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { FadeUp } from "@/components/motion/fade-up";

const ITEMS = [
  {
    q: "Is this just ChatGPT with a résumé wrapper?",
    a: "No, and the difference shows up after a few weeks of use. ChatGPT forgets you between sessions. Kursa keeps a structured model of your career — your skills, decisions, goals, and the reasoning behind them — and uses it as context for every conversation. The agent isn't smart because the model is smart. It's smart because it remembers.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "You can export everything — your full skills profile, every résumé version, the entire conversation history with Aria, your journal entries — as JSON or PDF on the way out. We don't hold your career hostage. The expectation is that you stay because it's useful, not because leaving is painful.",
  },
  {
    q: "Does Aria apply to jobs for me automatically?",
    a: "No. Aria drafts, tailors, and queues — but a human presses send. The application pipeline is full of judgment calls (timing, tone, whether to apply at all) that don't belong to an agent yet. We may revisit this when models can be trusted with that judgment. Not now.",
  },
  {
    q: "How is this different from a career coach?",
    a: "It's not a replacement, and we'll tell anyone who asks the same thing. A good coach reads you in ways the product can't. What Kursa does is the work between sessions — the tracking, the drafting, the watching for drift, the second-by-second context a coach simply doesn't have time to keep. If you already have a coach, Kursa makes their sessions sharper.",
  },
  {
    q: "Who is this not for?",
    a: "People who want a single résumé to send to 200 jobs in a week. People looking for a job board. People who already know exactly where they want to go and just need to get there fast — that's a different tool. Kursa earns its keep over years, not weekends.",
  },
  {
    q: "Will my employer find out I'm using it?",
    a: "No. The journal, conversations, and any draft applications live in your account and are never indexed externally. We don't sell signals to recruiters or employers. The product only works if you trust it with the honest version of where you are — so the boundaries are non-negotiable.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const reduced = useReducedMotion();

  return (
    <section id="faq" className="py-24 border-b border-[var(--line)]">
      <div className="mx-auto max-w-3xl px-6">
        <FadeUp>
          <div className="eyebrow mono mb-3">
            <span style={{ color: "var(--mute-3)" }}>·</span> questions
          </div>
          <h2
            className="font-semibold tracking-tight text-[var(--ink)] mb-4"
            style={{ fontSize: "var(--text-3xl)" }}
          >
            The real ones, answered honestly.
          </h2>
          <p className="mb-10" style={{ fontSize: "var(--text-sm)", color: "var(--mute)" }}>
            Don't see yours?{" "}
            <a
              href="mailto:shreeraj@kursa.app"
              className="text-[var(--ink)] underline underline-offset-2 transition-colors hover:text-[var(--accent)]"
            >
              Email a founder
            </a>{" "}
            — replies in under a day.
          </p>
        </FadeUp>

        <div>
          {ITEMS.map((it, i) => (
            <div key={i} className={i < ITEMS.length - 1 ? "border-b border-[var(--line)]" : ""}>
              <button
                className="w-full flex items-center justify-between gap-6 py-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span
                  className="font-medium text-[var(--ink)]"
                  style={{ fontSize: "var(--text-base)" }}
                >
                  {it.q}
                </span>
                <motion.span
                  animate={{ rotate: open === i ? 45 : 0 }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 300, damping: 22 }
                  }
                  className="flex-shrink-0 select-none"
                  style={{ color: "var(--mute)", fontSize: 20, lineHeight: 1, display: "inline-block" }}
                >
                  +
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    key="answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
                    }
                    style={{ overflow: "hidden" }}
                  >
                    <div
                      className="pb-5 leading-relaxed"
                      style={{ fontSize: "var(--text-sm)", color: "var(--mute)" }}
                    >
                      {it.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
