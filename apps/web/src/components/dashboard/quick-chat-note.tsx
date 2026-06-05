"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import type { Route } from "next";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { api } from "@/lib/api";

type QuickTag = "reflection" | "idea" | "blocker";

const TAGS: Array<{ id: QuickTag; label: string; hint: string }> = [
  { id: "reflection", label: "remember", hint: "Context Aria should keep in mind" },
  { id: "idea", label: "idea", hint: "A plan, hunch, or opportunity" },
  { id: "blocker", label: "blocker", hint: "Something slowing you down" },
];

const PROMPTS = [
  "I want Aria to remember…",
  "Today I noticed…",
  "A recruiter/company update…",
  "Something I need help with…",
];

export default function QuickChatNote() {
  const [text, setText] = useState("");
  const [tag, setTag] = useState<QuickTag>("reflection");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSave = text.trim().length > 0 && !isPending;

  function usePrompt(prompt: string) {
    setText((current) => (current.trim() ? current : `${prompt} `));
  }

  function handleSave() {
    const body = text.trim();
    if (!body) {
      toast.error("Jot something down first");
      return;
    }

    startTransition(async () => {
      try {
        await api.journal.createNote({ body, mood: 3, tags: [tag] });
        setText("");
        setLastSaved(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
        toast.success("Saved to Aria memory");
      } catch {
        toast.error("Could not save note");
      }
    });
  }

  return (
    <section className="relative overflow-hidden rounded-lg border border-line bg-surface p-4">
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-accent-soft blur-2xl" />
      <div className="relative">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="mono text-[9px] uppercase tracking-[0.18em] text-accent">quick chat</p>
            <h2 className="mt-1 text-sm font-semibold tracking-tight text-ink">Tell Aria anything</h2>
            <p className="mt-1 text-xs leading-relaxed text-mute">
              Drop messy career notes here — updates, doubts, wins, context — and Kursa stores them like journal memory.
            </p>
          </div>
          <Link
            href={"/dashboard/journal" as Route}
            className="mono shrink-0 rounded-md border border-line bg-bg px-2 py-1 text-[9px] text-mute transition-colors hover:text-ink"
          >
            journal →
          </Link>
        </div>

        <div className="mb-2 flex flex-wrap gap-1.5">
          {TAGS.map((item) => (
            <button
              key={item.id}
              type="button"
              title={item.hint}
              onClick={() => setTag(item.id)}
              className={`mono rounded-full border px-2 py-0.5 text-[9px] transition-colors ${
                tag === item.id
                  ? "border-accent-line bg-accent-soft text-accent"
                  : "border-line bg-bg text-mute hover:text-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="rounded-md border border-line bg-bg-sub p-2 transition-colors focus-within:border-accent-line">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Quickly jot: interview update, company intel, a worry, a useful detail, or what changed today…"
            rows={4}
            className="min-h-24 w-full resize-none bg-transparent text-xs leading-relaxed text-ink outline-none placeholder:text-mute-3"
          />
          <div className="flex flex-col gap-2 border-t border-line pt-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1">
              {PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => usePrompt(prompt)}
                  className="mono rounded border border-line bg-surface px-1.5 py-0.5 text-[8px] text-mute transition-colors hover:text-ink"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <motion.button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="mono rounded bg-accent px-3 py-1.5 text-[9px] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              whileTap={{ scale: 0.97 }}
            >
              {isPending ? "saving…" : "save for AI"}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {lastSaved && (
            <motion.p
              key={lastSaved}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mono mt-2 text-[9px] text-mute"
            >
              last saved {lastSaved} · available in Journal and Aria context
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
