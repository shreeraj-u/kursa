"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { UserLearningGoal, UserSkill } from "@kursa/types";
import { learningGoalStatusValues } from "@kursa/types";
import { api } from "@/lib/api";

type Status = (typeof learningGoalStatusValues)[number];

const COLUMNS: {
  status: Status;
  label: string;
  dot: string;
  emptyText: string;
  help: string;
}[] = [
  {
    status: "PLANNED",
    label: "Planned",
    dot: "bg-[var(--mute-3)]",
    emptyText: "nothing queued",
    help: "Skills to start later",
  },
  {
    status: "LEARNING",
    label: "Learning",
    dot: "bg-blue-400",
    emptyText: "nothing active",
    help: "Keep this focused",
  },
  {
    status: "COMPLETED",
    label: "Done",
    dot: "bg-emerald-500",
    emptyText: "nothing yet",
    help: "Skills you finished",
  },
];

interface LearningGoalsProps {
  goals: UserLearningGoal[];
  skills: UserSkill[];
  onChange: (goals: UserLearningGoal[]) => void;
  onSkillAdded: (skill: UserSkill) => void;
}

function goalTime(goal: UserLearningGoal): number {
  return new Date(goal.createdAt).getTime() || 0;
}

function sortGoals(goals: UserLearningGoal[]) {
  return [...goals].sort((a, b) => {
    const aStatus = learningGoalStatusValues.indexOf(a.status as Status);
    const bStatus = learningGoalStatusValues.indexOf(b.status as Status);
    if (aStatus !== bStatus) return aStatus - bStatus;
    if ((a.position ?? 0) !== (b.position ?? 0)) return (a.position ?? 0) - (b.position ?? 0);
    return goalTime(a) - goalTime(b);
  });
}

function normalizePositions(goals: UserLearningGoal[]) {
  const next = goals.map((goal) => ({ ...goal }));
  for (const { status } of COLUMNS) {
    sortGoals(next.filter((goal) => goal.status === status)).forEach((goal, index) => {
      const target = next.find((g) => g.id === goal.id);
      if (target) target.position = index;
    });
  }
  return sortGoals(next);
}

function moveGoalInMemory(
  goals: UserLearningGoal[],
  goalId: string,
  targetStatus: Status,
  targetIndex?: number,
) {
  const moving = goals.find((goal) => goal.id === goalId);
  if (!moving) return goals;

  const withoutMoving = goals.filter((goal) => goal.id !== goalId);
  const targetColumn = sortGoals(withoutMoving.filter((goal) => goal.status === targetStatus));
  const insertAt = Math.max(0, Math.min(targetIndex ?? targetColumn.length, targetColumn.length));
  targetColumn.splice(insertAt, 0, { ...moving, status: targetStatus });

  const byId = new Map(withoutMoving.map((goal) => [goal.id, goal]));
  targetColumn.forEach((goal, index) => {
    byId.set(goal.id, { ...goal, status: targetStatus, position: index });
  });

  return normalizePositions(Array.from(byId.values()));
}

function changedGoals(prev: UserLearningGoal[], next: UserLearningGoal[]) {
  const prevById = new Map(prev.map((goal) => [goal.id, goal]));
  return next.filter((goal) => {
    const before = prevById.get(goal.id);
    return before && (before.status !== goal.status || before.position !== goal.position);
  });
}

function mergeGoal(goals: UserLearningGoal[], goal: UserLearningGoal) {
  const replaced = goals.map((existing) =>
    existing.id === goal.id || existing.skillName.toLowerCase() === goal.skillName.toLowerCase()
      ? goal
      : existing,
  );
  const found = goals.some(
    (existing) =>
      existing.id === goal.id ||
      existing.skillName.toLowerCase() === goal.skillName.toLowerCase(),
  );
  return found ? replaced : [...goals, goal];
}

export function LearningGoals({ goals, skills, onChange, onSkillAdded }: LearningGoalsProps) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const orderedGoals = useMemo(() => normalizePositions(goals), [goals]);
  const inventoryNames = useMemo(() => new Set(skills.map((skill) => skill.name.toLowerCase())), [skills]);
  const existingGoalNames = useMemo(() => new Set(goals.map((goal) => goal.skillName.toLowerCase())), [goals]);
  const suggestedSkills = useMemo(() => {
    const needle = name.trim().toLowerCase();
    return skills
      .filter((skill) => !existingGoalNames.has(skill.name.toLowerCase()))
      .filter((skill) => !needle || skill.name.toLowerCase().includes(needle))
      .slice(0, 5);
  }, [skills, existingGoalNames, name]);

  async function persistChanged(prev: UserLearningGoal[], next: UserLearningGoal[]) {
    const changed = changedGoals(prev, next);
    await Promise.all(
      changed.map((goal) =>
        api.updateLearningGoal(goal.id, {
          status: goal.status as Status,
          position: goal.position ?? 0,
        }),
      ),
    );
  }

  async function commitMove(goalId: string, targetStatus: Status, targetIndex?: number) {
    const prev = orderedGoals;
    const next = moveGoalInMemory(prev, goalId, targetStatus, targetIndex);
    if (next === prev) return;
    onChange(next);
    try {
      await persistChanged(prev, next);
    } catch (err) {
      onChange(prev);
      toast.error(err instanceof Error ? err.message : "Could not move goal");
    }
  }

  async function addGoal() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Enter a skill name first");
      return;
    }
    if (existingGoalNames.has(trimmed.toLowerCase())) {
      toast.info(`${trimmed} is already in your learning queue`);
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const planned = orderedGoals.filter((goal) => goal.status === "PLANNED");
      const { learningGoal } = await api.createLearningGoal({
        skillName: trimmed,
        status: "PLANNED",
        position: planned.length,
      });
      onChange(normalizePositions(mergeGoal(goals, learningGoal)));
      setName("");
      setShowSuggestions(false);
      toast.success(`Queued ${learningGoal.skillName}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add goal");
    } finally {
      setBusy(false);
    }
  }

  async function deleteGoal(id: string) {
    const prev = orderedGoals;
    const next = normalizePositions(orderedGoals.filter((g) => g.id !== id));
    onChange(next);
    try {
      await api.deleteLearningGoal(id);
      await persistChanged(prev.filter((g) => g.id !== id), next);
    } catch (err) {
      onChange(prev);
      toast.error(err instanceof Error ? err.message : "Could not remove goal");
    }
  }


  async function addGoalToInventory(goal: UserLearningGoal) {
    if (inventoryNames.has(goal.skillName.toLowerCase())) return;
    try {
      const { skill } = await api.createSkill({
        name: goal.skillName,
        category: "technical",
        confidenceRating: 1,
        proficiencyLevel: "beginner",
      });
      onSkillAdded(skill);
      toast.success(`${skill.name} added to your skill inventory`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add skill to inventory");
    }
  }

  function moveStatus(goal: UserLearningGoal, direction: -1 | 1) {
    const idx = learningGoalStatusValues.indexOf(goal.status as Status);
    const nextStatus = learningGoalStatusValues[Math.max(0, Math.min(idx + direction, learningGoalStatusValues.length - 1))];
    if (nextStatus !== goal.status) void commitMove(goal.id, nextStatus);
  }

  function moveWithinColumn(goal: UserLearningGoal, direction: -1 | 1) {
    const column = sortGoals(orderedGoals.filter((g) => g.status === goal.status));
    const idx = column.findIndex((g) => g.id === goal.id);
    const nextIndex = idx + direction;
    if (nextIndex < 0 || nextIndex >= column.length) return;
    void commitMove(goal.id, goal.status as Status, nextIndex);
  }

  function dropOnColumn(status: Status) {
    if (!draggingId) return;
    void commitMove(draggingId, status);
    setDraggingId(null);
  }

  function dropOnCard(status: Status, index: number) {
    if (!draggingId) return;
    void commitMove(draggingId, status, index);
    setDraggingId(null);
  }

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[var(--ink)]">Learning queue</h2>
        <p className="mt-0.5 text-xs leading-relaxed text-[var(--mute)]">
          Organize the skills you&apos;re building. Queue cards link to matching inventory skills by name; missing ones can be added to your inventory when they become real skills.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3">
        {COLUMNS.map((col) => {
          const colGoals = sortGoals(orderedGoals.filter((g) => g.status === col.status));
          return (
            <div
              key={col.status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dropOnColumn(col.status)}
              className="rounded-lg border border-[var(--line)] bg-[var(--bg-sub)] p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />
                  <span className="mono text-[10px] text-[var(--mute)]">{col.label}</span>
                  <span className="mono text-[10px] text-[var(--mute-3)]">{colGoals.length}</span>
                </div>
                <span className="text-[11px] text-[var(--mute-3)]">{col.help}</span>
              </div>

              <div className="flex min-h-12 flex-col gap-1.5">
                {colGoals.length === 0 ? (
                  <div className="rounded-md border border-dashed border-[var(--line)] px-2 py-3 text-center">
                    <span className="mono text-[10px] text-[var(--mute-3)]">{col.emptyText}</span>
                  </div>
                ) : (
                  colGoals.map((goal, index) => {
                    const isDone = goal.status === "COMPLETED";
                    const inInventory = inventoryNames.has(goal.skillName.toLowerCase());
                    return (
                      <div
                        key={goal.id}
                        draggable
                        onDragStart={() => setDraggingId(goal.id)}
                        onDragEnd={() => setDraggingId(null)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.stopPropagation();
                          dropOnCard(col.status, index);
                        }}
                        className="group rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 shadow-sm transition-colors hover:border-[var(--mute-3)]"
                        style={{ opacity: draggingId === goal.id ? 0.45 : 1 }}
                      >
                        <div className="flex items-start gap-2">
                          <span className="mono mt-0.5 cursor-grab text-xs text-[var(--mute-3)]" title="Drag to reorder">⋮⋮</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="min-w-0 flex-1 truncate text-sm font-medium"
                                style={{
                                  color: isDone ? "var(--mute-3)" : "var(--ink)",
                                  textDecoration: isDone ? "line-through" : "none",
                                }}
                                title={goal.skillName}
                              >
                                {goal.skillName}
                              </span>
                              <span className={`mono shrink-0 rounded-full px-2 py-0.5 text-[9px] ${inInventory ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                                {inInventory ? "inventory" : "new"}
                              </span>
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1">
                                <button type="button" onClick={() => moveWithinColumn(goal, -1)} className="mono flex h-6 w-6 items-center justify-center rounded border border-[var(--line)] text-[10px] text-[var(--mute)] hover:text-[var(--ink)]" aria-label={`Move ${goal.skillName} up`}>↑</button>
                                <button type="button" onClick={() => moveWithinColumn(goal, 1)} className="mono flex h-6 w-6 items-center justify-center rounded border border-[var(--line)] text-[10px] text-[var(--mute)] hover:text-[var(--ink)]" aria-label={`Move ${goal.skillName} down`}>↓</button>
                                <button type="button" onClick={() => moveStatus(goal, -1)} disabled={goal.status === "PLANNED"} className="mono flex h-6 w-6 items-center justify-center rounded border border-[var(--line)] text-[10px] text-[var(--mute)] hover:text-[var(--ink)] disabled:opacity-30" aria-label={`Move ${goal.skillName} to previous status`}>←</button>
                                <button type="button" onClick={() => moveStatus(goal, 1)} disabled={goal.status === "COMPLETED"} className="mono flex h-6 w-6 items-center justify-center rounded border border-[var(--line)] text-[10px] text-[var(--mute)] hover:text-[var(--ink)] disabled:opacity-30" aria-label={`Move ${goal.skillName} to next status`}>→</button>
                              </div>

                              <div className="flex items-center gap-1">
                                {!inInventory && (
                                  <button type="button" onClick={() => addGoalToInventory(goal)} className="mono rounded border border-[var(--line)] px-2 py-1 text-[10px] text-[var(--mute)] hover:text-[var(--ink)]">add skill</button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => deleteGoal(goal.id)}
                                  aria-label={`Remove ${goal.skillName}`}
                                  className="flex h-6 w-6 items-center justify-center rounded border border-transparent text-[var(--mute-3)] transition-colors hover:border-[var(--line)] hover:text-[var(--ink)]"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 border-t border-[var(--line)] pt-3">
        <div className="relative flex-1">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
            onKeyDown={(e) => e.key === "Enter" && addGoal()}
            placeholder="Add a skill to learn…"
            className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-sm"
          />
          {showSuggestions && suggestedSkills.length > 0 && (
            <div className="absolute bottom-full z-20 mb-2 w-full overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface)] shadow-lg">
              <div className="border-b border-[var(--line)] bg-[var(--bg-sub)] px-3 py-2">
                <span className="mono text-[10px] text-[var(--mute-3)]">
                  from your inventory
                </span>
              </div>
              <div className="max-h-44 overflow-y-auto p-1">
                {suggestedSkills.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setName(skill.name);
                      setShowSuggestions(false);
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-xs transition-colors hover:bg-[var(--bg-sub)]"
                  >
                    <span className="truncate font-medium text-[var(--ink)]">
                      {skill.name}
                    </span>
                    <span className="mono shrink-0 text-[10px] text-[var(--mute-3)]">
                      {skill.proficiencyLevel ?? "no level"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={addGoal}
          disabled={busy}
          className="rounded-md bg-[var(--accent)] px-4 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {busy ? "Adding…" : "Add"}
        </button>
      </div>
    </div>
  );
}
