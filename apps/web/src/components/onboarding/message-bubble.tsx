import { motion } from "motion/react";

import type { Message } from "./types";

export function MessageBubble({ message }: { message: Message }) {
  const isBot = message.role === "bot";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex ${isBot ? "justify-start" : "justify-end"}`}
    >
      <div className={`flex max-w-[85%] gap-2 ${isBot ? "" : "flex-row-reverse"}`}>
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5 border text-xs mono text-ink ${
            isBot ? "border-accent bg-[var(--accent-soft)]" : "border-line bg-bg-sub"
          }`}
        >
          {isBot ? "K" : "y"}
        </div>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed border ${
            isBot
              ? "bg-bg-sub text-ink border-line"
              : "bg-ink text-bg border-ink"
          }`}
        >
          {message.text}
        </div>
      </div>
    </motion.div>
  );
}
