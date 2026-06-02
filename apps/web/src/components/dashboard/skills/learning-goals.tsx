"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { UserLearningGoal } from "@kursa/types";
import { learningGoalStatusValues } from "@kursa/types";
import { api } from "@/lib/api";

type Status = (typeof learningGoalStatusValues)[number];

const COLUMNS: {
  status: Status;
  label: string;
  dot: string;
  emptyText: string;
}[] = [
  {
    status: "PLANNED",
    label: "Planned",
    dot: "bg-[var(--mute-3)]",
    emptyText: "nothing queued",
  },
  {
    status: "LEARNING",
    label: "Learning",
    dot: "bg-blue-400",
    emptyText: "nothing active",
  },
  {
    status: "COMPLETED",
    label: "Done",
    dot: "bg-emerald-500",
    emptyText: "nothing yet",
  },
];

interface LearningGoalsProps {
  goals: UserLearningGoal[];
  onChange: (goals: UserLearningGoal[]) => void;
}

export function LearningGoals({ goals, onChange }: LearningGoalsProps) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function addGoal() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Enter a skill name first");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const { learningGoal } = await api.createLearningGoal({
        skillName: trimmed,
      });
      onChange([...goals, learningGoal]);
      setName("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add goal");
    } finally {
      setBusy(false);
    }
  }

  async function updateGoal(id: string, patch: Partial<UserLearningGoal>) {
    const prev = goals;
    onChange(goals.map((g) => (g.id === id ? { ...g, ...patch } : g)));
    try {
      await api.updateLearningGoal(id, { status: patch.status as Status });
    } catch (err) {
      onChange(prev);
      toast.error(err instanceof Error ? err.message : "Could not update goal");
    }
  }

  async function deleteGoal(id: string) {
    const prev = goals;
    onChange(goals.filter((g) => g.id !== id));
    try {
      await api.deleteLearningGoal(id);
    } catch {
      onChange(prev);
    }
  }

  function cycleStatus(goal: UserLearningGoal) {
    const idx = learningGoalStatusValues.indexOf(goal.status as Status);
    const next =
      learningGoalStatusValues[(idx + 1) % learningGoalStatusValues.length];
    updateGoal(goal.id, { status: next });
  }

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[var(--ink)]">Learning queue</h2>
        <p className="mt-0.5 text-xs text-[var(--mute)]">
          Skills you&apos;re actively building. Click the dot on a card to move it forward.
          Missing gaps from the right panel drop in here automatically.
        </p>
      </div>

      {/* Kanban columns */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {COLUMNS.map((col) => {
          const colGoals = goals.filter((g) => g.status === col.status);
          return (
            <div key={col.status}>
              <div className="mb-2 flex items-center gap-1.5">
                <div className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />
                <span className="mono text-[10px] text-[var(--mute)]">
                  {col.label}
                </span>
                {colGoals.length > 0 && (
                  <span className="mono text-[10px] text-[var(--mute-3)]">
                    {colGoals.length}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                {colGoals.length === 0 ? (
                  <div className="rounded-md border border-dashed border-[var(--line)] px-2 py-2.5 text-center">
                    <span className="mono text-[10px] text-[var(--mute-3)]">
                      {col.emptyText}
                    </span>
                  </div>
                ) : (
                  colGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className="group flex items-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--bg-sub)] px-2 py-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => cycleStatus(goal)}
                        title="Cycle status"
                        className={`h-1.5 w-1.5 shrink-0 rounded-full transition-opacity hover:opacity-60 ${col.dot}`}
                      />
                      <span
                        className="flex-1 truncate text-xs"
                        style={{
                          color:
                            goal.status === "COMPLETED"
                              ? "var(--mute-3)"
                              : "var(--ink)",
                          textDecoration:
                            goal.status === "COMPLETED"
                              ? "line-through"
                              : "none",
                        }}
                        title={goal.skillName}
                      >
                        {goal.skillName}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteGoal(goal.id)}
                        aria-label={`Remove ${goal.skillName}`}
                        className="shrink-0 text-[var(--mute-3)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--ink)]"
                        style={{ fontSize: 13 }}
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add form */}
      <div className="flex gap-2 border-t border-[var(--line)] pt-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addGoal()}
          placeholder="Add a skill to learn…"
          className="flex-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={addGoal}
          disabled={busy}
          className="rounded-md bg-[var(--accent)] px-4 py-1.5 text-sm text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}
