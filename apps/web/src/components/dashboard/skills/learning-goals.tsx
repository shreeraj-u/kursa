"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { UserLearningGoal } from "@kursa/types";
import { learningGoalStatusValues } from "@kursa/types";
import { api } from "@/lib/api";

type Status = (typeof learningGoalStatusValues)[number];

const STATUS_LABEL: Record<Status, string> = {
  PLANNED: "planned",
  LEARNING: "in progress",
  COMPLETED: "completed",
};

interface LearningGoalsProps {
  goals: UserLearningGoal[];
  onChange: (goals: UserLearningGoal[]) => void;
}

function GoalRow({
  goal,
  onUpdate,
  onDelete,
}: {
  goal: UserLearningGoal;
  onUpdate: (patch: Partial<UserLearningGoal>) => void;
  onDelete: () => void;
}) {
  const done = goal.status === "COMPLETED";
  return (
    <div className="flex items-center gap-2 py-1">
      <span
        className="flex-1 truncate text-sm"
        style={{
          color: done ? "var(--mute-3)" : "var(--ink)",
          textDecoration: done ? "line-through" : "none",
        }}
        title={goal.skillName}
      >
        {goal.skillName}
      </span>
      <select
        value={goal.status}
        onChange={(e) => onUpdate({ status: e.target.value })}
        className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-1.5 py-0.5 text-xs text-[var(--mute)]"
      >
        {learningGoalStatusValues.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Remove ${goal.skillName}`}
        className="flex-shrink-0 text-[var(--mute)] hover:text-[var(--ink)]"
      >
        ×
      </button>
    </div>
  );
}

export function LearningGoals({ goals, onChange }: LearningGoalsProps) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function addGoal() {
    const trimmed = name.trim();
    if (!trimmed) { toast.error("Enter a skill name first"); return; }
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

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
      <h2 className="mb-3 text-sm font-semibold text-[var(--ink)]">Being built</h2>
      {goals.length === 0 ? (
        <p className="text-sm text-[var(--mute)]">
          Nothing in progress yet. Add a skill you&apos;re learning.
        </p>
      ) : (
        goals.map((goal) => (
          <GoalRow
            key={goal.id}
            goal={goal}
            onUpdate={(patch) => updateGoal(goal.id, patch)}
            onDelete={() => deleteGoal(goal.id)}
          />
        ))
      )}
      <div className="mt-3 flex gap-2 border-t border-[var(--line)] pt-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addGoal()}
          placeholder="Learning something new…"
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
