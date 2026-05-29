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
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5"
          style={{
            border: isBot ? "1px solid var(--accent)" : "1px solid var(--line)",
            background: isBot ? "var(--accent-soft, var(--bg-sub))" : "var(--bg-sub)",
          }}
        >
          <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--ink)" }}>
            {isBot ? "K" : "y"}
          </span>
        </div>
        <div
          className="rounded-2xl px-4 py-2.5"
          style={{
            background: isBot ? "var(--bg-sub)" : "var(--ink)",
            color: isBot ? "var(--ink)" : "var(--bg)",
            border: isBot ? "1px solid var(--line)" : "1px solid var(--ink)",
            fontSize: "var(--text-sm)",
            whiteSpace: "pre-wrap",
            lineHeight: 1.5,
          }}
        >
          {message.text}
        </div>
      </div>
    </motion.div>
  );
}
