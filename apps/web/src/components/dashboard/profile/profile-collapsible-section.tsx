"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

type Props = {
  id: string;
  eyebrow: string;
  title: string;
  description: React.ReactNode;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export default function ProfileCollapsibleSection({
  id,
  eyebrow,
  title,
  description,
  count,
  defaultOpen = true,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section id={id} className="scroll-mt-16 rounded-xl border border-line bg-surface overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        className="w-full flex items-start justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-bg-sub"
      >
        <div className="min-w-0">
          <div
            className="mono mb-1 text-mute tracking-[0.06em] uppercase"
            style={{ fontSize: "var(--text-xs)" }}
          >
            {eyebrow}
          </div>
          <h2 className="font-semibold text-ink" style={{ fontSize: "var(--text-2xl)" }}>
            {title}
          </h2>
          <p className="text-mute mt-1" style={{ fontSize: "var(--text-base)" }}>
            {description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1">
          {count !== undefined && (
            <span
              className="mono rounded-full border border-line px-2 py-0.5 text-mute-3"
              style={{ fontSize: "var(--text-xs)" }}
            >
              {count}
            </span>
          )}
          <ChevronDown
            size={18}
            className="text-mute-3 transition-transform duration-200"
            style={{ transform: open ? "rotate(180deg)" : "none" }}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${id}-panel`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-line px-6 pb-6 pt-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
