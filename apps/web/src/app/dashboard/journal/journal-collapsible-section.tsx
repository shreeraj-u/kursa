"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

type Props = {
  title: string;
  count: number;
  defaultOpen?: boolean;
  accentColor?: string;
  maxHeight?: number;
  children: React.ReactNode;
};

export function JournalCollapsibleSection({
  title,
  count,
  defaultOpen = true,
  accentColor = "var(--mute-2)",
  maxHeight = 420,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className="rounded-lg overflow-hidden"
      style={{ border: "1px solid var(--line)", background: "var(--bg-sub)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5"
        style={{
          border: "none",
          background: "var(--bg-sub)",
          cursor: "pointer",
          borderBottom: open ? "1px solid var(--line)" : "none",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="mono"
            style={{ fontSize: 9, color: accentColor, letterSpacing: "0.06em" }}
          >
            {title}
          </span>
          <span
            className="mono rounded-full px-1.5 py-px"
            style={{
              fontSize: 8,
              color: "var(--mute-3)",
              border: "1px solid var(--line)",
            }}
          >
            {count}
          </span>
        </div>
        <ChevronDown
          size={12}
          style={{
            color: "var(--mute-3)",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="overflow-y-auto px-4 py-3"
              style={{ maxHeight }}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
