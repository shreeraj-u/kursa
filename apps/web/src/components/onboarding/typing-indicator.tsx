import { motion } from "motion/react";

export function TypingIndicator({ avatar = "K" }: { avatar?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2"
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-accent bg-bg-sub text-xs text-ink mono">
        {avatar}
      </div>
      <div className="flex gap-1 rounded-2xl px-3 py-2 bg-bg-sub border border-line">
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            className="inline-block h-1.5 w-1.5 rounded-full bg-ink"
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: dot * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
