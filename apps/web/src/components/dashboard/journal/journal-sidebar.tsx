"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
  onSubmitPulse: (responses: Record<string, string | number>) => Promise<boolean> | boolean | void;
  pulseSaving: boolean;
};

export function JournalSidebar({
  relevance,
  relevanceLoading,
  memories,
  memoriesLoading,
  nudges,
  checkIn,
  onSubmitPulse,
  pulseSaving,
}: Props) {
  const due = checkIn?.due ?? false;
  const [pulseExpanded, setPulseExpanded] = useState(due);
  const [pulseResponses, setPulseResponses] = useState<Record<string, string | number>>({});

  useEffect(() => {
    setPulseResponses({});
  }, [checkIn?.type]);

  const handlePulseSubmit = async () => {
    if (!checkIn?.type) return;

    const firstTextQ = checkIn.questions.find((q) => q.kind === "text");
    if (firstTextQ && !String(pulseResponses[firstTextQ.id] ?? "").trim()) {
      toast.error("Answer the first question");
      return;
    }

    const success = await onSubmitPulse(pulseResponses);
    if (success !== false) {
      setPulseResponses({});
    }
  };

  return (
    <aside className="flex flex-col gap-4 w-full lg:w-72 flex-shrink-0">
      {nudges.length > 0 && (
        <div className="rounded-lg p-4 border border-line bg-surface">
          <JournalProactiveNudges nudges={nudges} />
        </div>
      )}

      <div className="rounded-lg overflow-hidden border border-line bg-surface">
        <button
          type="button"
          onClick={() => setPulseExpanded((v) => !v)}
          className={`w-full flex items-center justify-between px-4 py-3 bg-bg-sub border-none cursor-pointer ${
            pulseExpanded ? "border-b border-line" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            {due && <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-accent" />}
            <span className="mono text-2xs text-mute-2">
              weekly pulse
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!due && <span className="mono text-[8px] text-mute-3">not due</span>}
            <ChevronDown
              size={12}
              className={`text-mute-3 transition-transform duration-200 ${
                pulseExpanded ? "rotate-180" : ""
              }`}
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
                        <label key={q.id} className="mono text-2xs text-mute flex flex-col gap-1">
                          {q.label}: {pulseResponses[q.id] ?? 3}
                          <input
                            type="range"
                            min={1}
                            max={5}
                            value={Number(pulseResponses[q.id] ?? 3)}
                            onChange={(e) =>
                              setPulseResponses((prev) => ({ ...prev, [q.id]: Number(e.target.value) }))
                            }
                            className="mt-1.5 w-full cursor-pointer accent-accent"
                          />
                        </label>
                      ) : q.id === "rememberThis" ? (
                        <input
                          key={q.id}
                          value={String(pulseResponses[q.id] ?? "")}
                          onChange={(e) =>
                            setPulseResponses((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          placeholder={q.label}
                          className="w-full rounded px-2 py-1.5 outline-none border border-line bg-bg text-ink text-xs"
                        />
                      ) : (
                        <textarea
                          key={q.id}
                          value={String(pulseResponses[q.id] ?? "")}
                          onChange={(e) =>
                            setPulseResponses((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          placeholder={q.label}
                          rows={2}
                          className="w-full resize-none rounded px-2 py-1.5 outline-none border border-line bg-bg text-ink text-xs"
                        />
                      ),
                    )}
                    <button
                      type="button"
                      onClick={handlePulseSubmit}
                      disabled={pulseSaving}
                      className="mono rounded px-3 py-1 w-full bg-accent text-white border-none text-2xs cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                    >
                      {pulseSaving ? "submitting…" : "submit pulse"}
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-mute-2">
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

      <div className="rounded-lg p-4 border border-line bg-surface">
        <JournalRelevance data={relevance} loading={relevanceLoading} />
      </div>

      <div className="rounded-lg p-4 border border-line bg-surface">
        <JournalMemoriesPanel memories={memories} loading={memoriesLoading} />
      </div>
    </aside>
  );
}
