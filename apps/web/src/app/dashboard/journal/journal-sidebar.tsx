"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import type { ProactiveNudge, RelevanceSummary } from "@kursa/types";

import { JournalMemoriesPanel } from "./journal-memories";
import { JournalProactiveNudges } from "./journal-proactive";
import { JournalRelevance } from "./journal-relevance";

type CheckInNext = {
  due: boolean;
  type: "checkin_weekly" | "checkin_monthly" | null;
  questions: Array<{ id: string; label: string; kind: "text" | "scale" }>;
  lastCompletedAt: string | null;
};

type Memory = {
  id: string;
  category: string;
  fact: string;
  confidence: number;
  validFrom: string;
};

type Props = {
  relevance: RelevanceSummary | null;
  relevanceLoading: boolean;
  memories: Memory[];
  memoriesLoading: boolean;
  nudges: ProactiveNudge[];
  checkIn: CheckInNext | null;
  pulseResponses: Record<string, string | number>;
  onPulseResponseChange: (id: string, value: string | number) => void;
  onSubmitPulse: () => void;
  pulseSaving: boolean;
};

export function JournalSidebar({
  relevance,
  relevanceLoading,
  memories,
  memoriesLoading,
  nudges,
  checkIn,
  pulseResponses,
  onPulseResponseChange,
  onSubmitPulse,
  pulseSaving,
}: Props) {
  const due = checkIn?.due ?? false;
  const isMonthly = checkIn?.type === "checkin_monthly";
  const [pulseExpanded, setPulseExpanded] = useState(due);

  return (
    <aside className="flex flex-col gap-4 w-full lg:w-72 flex-shrink-0">
      {nudges.length > 0 && (
        <div
          className="rounded-lg p-4"
          style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
        >
          <JournalProactiveNudges nudges={nudges} />
        </div>
      )}

      <div
        className="rounded-lg overflow-hidden"
        style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
      >
        <button
          type="button"
          onClick={() => setPulseExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3"
          style={{
            border: "none",
            background: "var(--bg-sub)",
            cursor: "pointer",
            borderBottom: pulseExpanded ? "1px solid var(--line)" : "none",
          }}
        >
          <div className="flex items-center gap-2">
            {due && (
              <span
                className="rounded-full animate-pulse"
                style={{ width: 6, height: 6, background: "var(--accent)" }}
              />
            )}
            <span className="mono" style={{ fontSize: 9, color: "var(--mute-2)" }}>
              {isMonthly ? "monthly review" : "weekly pulse"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!due && (
              <span className="mono" style={{ fontSize: 8, color: "var(--mute-3)" }}>
                not due
              </span>
            )}
            <ChevronDown
              size={12}
              style={{
                color: "var(--mute-3)",
                transform: pulseExpanded ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}
            />
          </div>
        </button>

        <AnimatePresence initial={false}>
          {pulseExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 flex flex-col gap-3">
                {due && checkIn ? (
                  <>
                    {checkIn.questions.map((q) =>
                      q.kind === "scale" ? (
                        <label key={q.id} className="mono" style={{ fontSize: 9, color: "var(--mute)" }}>
                          {q.label}: {pulseResponses[q.id] ?? 3}
                          <input
                            type="range"
                            min={1}
                            max={5}
                            value={Number(pulseResponses[q.id] ?? 3)}
                            onChange={(e) => onPulseResponseChange(q.id, Number(e.target.value))}
                            className="mt-1.5 w-full"
                            style={{ accentColor: "var(--accent)" }}
                          />
                        </label>
                      ) : (
                        q.id === "rememberThis" || q.id === "blockers" || q.id === "winsSinceLast" ? (
                          <input
                            key={q.id}
                            value={String(pulseResponses[q.id] ?? "")}
                            onChange={(e) => onPulseResponseChange(q.id, e.target.value)}
                            placeholder={q.label}
                            className="w-full rounded px-2 py-1.5 outline-none"
                            style={{
                              fontSize: "var(--text-xs)",
                              border: "1px solid var(--line)",
                              background: "var(--bg)",
                              color: "var(--ink)",
                            }}
                          />
                        ) : (
                          <textarea
                            key={q.id}
                            value={String(pulseResponses[q.id] ?? "")}
                            onChange={(e) => onPulseResponseChange(q.id, e.target.value)}
                            placeholder={q.label}
                            rows={2}
                            className="w-full resize-none rounded px-2 py-1.5 outline-none"
                            style={{
                              fontSize: "var(--text-xs)",
                              border: "1px solid var(--line)",
                              background: "var(--bg)",
                              color: "var(--ink)",
                            }}
                          />
                        )
                      ),
                    )}
                    <button
                      type="button"
                      onClick={onSubmitPulse}
                      disabled={pulseSaving}
                      className="mono rounded px-3 py-1 w-full"
                      style={{
                        fontSize: 9,
                        background: "var(--accent)",
                        color: "var(--accent-fg, #fff)",
                        border: "none",
                        opacity: pulseSaving ? 0.6 : 1,
                        cursor: pulseSaving ? "wait" : "pointer",
                      }}
                    >
                      {pulseSaving ? "submitting…" : isMonthly ? "submit review" : "submit pulse"}
                    </button>
                  </>
                ) : (
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--mute-2)" }}>
                    {checkIn?.lastCompletedAt
                      ? `Last completed ${new Date(checkIn.lastCompletedAt).toLocaleDateString()}`
                      : "Your next pulse will appear here when due."}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        className="rounded-lg p-4"
        style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
      >
        <JournalRelevance data={relevance} loading={relevanceLoading} />
      </div>

      <div
        className="rounded-lg p-4"
        style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
      >
        <JournalMemoriesPanel memories={memories} loading={memoriesLoading} />
      </div>
    </aside>
  );
}
