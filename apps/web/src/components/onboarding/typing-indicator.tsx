import { motion } from "motion/react";

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2"
    >
      <div
        className="flex h-7 w-7 items-center justify-center rounded-full"
        style={{ border: "1px solid var(--accent)", background: "var(--bg-sub)" }}
      >
        <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--ink)" }}>K</span>
      </div>
      <div
        className="flex gap-1 rounded-2xl px-3 py-2"
        style={{ background: "var(--bg-sub)", border: "1px solid var(--line)" }}
      >
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--ink)" }}
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: dot * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
