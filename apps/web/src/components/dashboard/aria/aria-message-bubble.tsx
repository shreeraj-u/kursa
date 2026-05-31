"use client";

import { motion } from "motion/react";

type Props = {
  role: "user" | "assistant";
  content: string;
};

export function AriaMessageBubble({ role, content }: Props) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`flex max-w-[min(640px,88%)] gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
        {!isUser && (
          <div
            className="mono flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-2xs"
            style={{
              borderColor: "var(--accent)",
              background: "var(--accent-soft)",
              color: "var(--ink)",
              marginTop: 2,
            }}
          >
            a
          </div>
        )}
        <div
          className="rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
          style={
            isUser
              ? { background: "var(--ink)", color: "var(--bg)", border: "1px solid var(--ink)" }
              : { background: "var(--bg-sub)", color: "var(--ink)", border: "1px solid var(--line)" }
          }
        >
          {content}
        </div>
      </div>
    </motion.div>
  );
}
