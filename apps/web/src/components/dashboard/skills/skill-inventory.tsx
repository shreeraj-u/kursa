"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { UserSkill, SkillUpdateInput } from "@kursa/types";
import { skillCategoryValues, skillProficiencyValues } from "@kursa/types";
import { api } from "@/lib/api";

type Category = (typeof skillCategoryValues)[number];
type Proficiency = (typeof skillProficiencyValues)[number];

const CATEGORY_COLOR: Record<Category, string> = {
  technical: "#6366f1",
  soft: "#22c55e",
  tool: "#f59e0b",
};

const CATEGORY_LABEL: Record<Category, string> = {
  technical: "Technical",
  soft: "Soft",
  tool: "Tools",
};

const PROFICIENCY_BORDER: Record<string, string> = {
  beginner:     "border-gray-300",
  intermediate: "border-blue-300",
  advanced:     "border-violet-400",
  expert:       "border-emerald-400",
};

const DORMANT_MONTHS = 6;

function monthsSince(date: string | Date | null): number | null {
  if (!date) return null;
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return null;
  return (Date.now() - then) / (1000 * 60 * 60 * 24 * 30.44);
}

function recencyLabel(date: string | Date | null): string {
  const months = monthsSince(date);
  if (months === null) return "";
  if (months < 1) return "now";
  if (months < 12) return `${Math.round(months)}mo`;
  return `${Math.floor(months / 12)}yr`;
}

function isDormant(skill: UserSkill): boolean {
  const months = monthsSince(skill.lastUsedDate);
  return months !== null && months >= DORMANT_MONTHS;
}

function toDateInputValue(date: string | Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function SkillPill({
  skill,
  active,
  onClick,
}: {
  skill: UserSkill;
  active: boolean;
  onClick: () => void;
}) {
  const dormant = isDormant(skill);
  const borderClass = skill.proficiencyLevel
    ? (PROFICIENCY_BORDER[skill.proficiencyLevel] ?? "border-[var(--line)]")
    : "border-[var(--line)]";

  return (
    <button
      type="button"
      onClick={onClick}
      title={skill.name}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all ${borderClass} ${
        active
          ? "bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)]"
          : "bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--mute-3)]"
      }`}
      style={{ opacity: dormant && !active ? 0.45 : 1 }}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{
          background: active
            ? "currentColor"
            : CATEGORY_COLOR[(skill.category as Category) ?? "technical"],
        }}
      />
      <span
        style={{
          fontStyle: dormant ? "italic" : "normal",
          maxWidth: 120,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {skill.name}
      </span>
      {/* Confidence dots */}
      <span className="flex gap-px opacity-70">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className="inline-block h-1 w-1 rounded-full"
            style={{
              background:
                n <= (skill.confidenceRating ?? 0)
                  ? active
                    ? "currentColor"
                    : "var(--accent)"
                  : active
                    ? "rgba(255,255,255,0.3)"
                    : "var(--line)",
            }}
          />
        ))}
      </span>
    </button>
  );
}

function SkillDrawer({
  skill,
  onSave,
  onDelete,
  onClose,
}: {
  skill: UserSkill;
  onSave: (patch: SkillUpdateInput) => Promise<boolean>;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [saved, setSaved] = useState(false);

  async function save(patch: SkillUpdateInput) {
    const ok = await onSave(patch);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1400);
    }
  }

  return (
    <div className="mt-2 rounded-lg border border-[var(--line)] bg-[var(--bg-sub)] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-[var(--ink)]">
          {skill.name}
          {saved && (
            <span className="mono ml-2 text-[9px]" style={{ color: "var(--accent)" }}>
              ✓ saved
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDelete}
            className="mono text-[11px] text-[var(--mute-3)] hover:text-red-500 transition-colors"
          >
            remove
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--mute-3)] hover:text-[var(--ink)]"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Confidence */}
        <div className="flex items-center gap-1.5">
          <span className="mono text-[10px] text-[var(--mute-3)]">confidence</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                title={`Set confidence to ${n}`}
                onClick={() => save({ confidenceRating: n })}
                className="h-2 w-2 rounded-full transition-colors"
                style={{
                  background:
                    n <= (skill.confidenceRating ?? 0)
                      ? "var(--accent)"
                      : "var(--line)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Level */}
        <div className="flex items-center gap-1.5">
          <span className="mono text-[10px] text-[var(--mute-3)]">level</span>
          <select
            value={skill.proficiencyLevel ?? ""}
            onChange={(e) =>
              save({ proficiencyLevel: (e.target.value || null) as Proficiency | null })
            }
            className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 text-xs text-[var(--mute)]"
          >
            <option value="">— not set</option>
            {skillProficiencyValues.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Last used */}
        <div className="flex items-center gap-1.5">
          <span className="mono text-[10px] text-[var(--mute-3)]">last used</span>
          <input
            type="date"
            value={toDateInputValue(skill.lastUsedDate)}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) =>
              save({
                lastUsedDate: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : null,
              })
            }
            className="mono rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 text-[11px] text-[var(--mute)]"
          />
          {skill.lastUsedDate && (
            <span className="mono text-[10px] text-[var(--mute-3)]">
              ({recencyLabel(skill.lastUsedDate)})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function AddSkillForm({ onAdd }: { onAdd: (skill: UserSkill) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("technical");
  const [confidenceRating, setConfidenceRating] = useState(3);
  const [proficiencyLevel, setProficiencyLevel] = useState<Proficiency | "">("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Enter a skill name first");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const { skill } = await api.createSkill({
        name: trimmed,
        category,
        confidenceRating,
        proficiencyLevel: proficiencyLevel || null,
      });
      onAdd(skill);
      setName("");
      setConfidenceRating(3);
      setProficiencyLevel("");
      setOpen(false);
      toast.success(`Added ${skill.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add skill");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mono w-full rounded-lg border border-dashed border-[var(--line)] py-2.5 text-xs text-[var(--mute)] transition-colors hover:border-[var(--mute-3)] hover:text-[var(--ink)]"
      >
        + add skill
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-sub)] p-3">
      <div className="flex flex-col gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Skill name…"
          autoFocus
          className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-sm"
        />
        <div className="flex items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="flex-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5 text-xs"
          >
            {skillCategoryValues.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
          <select
            value={proficiencyLevel}
            onChange={(e) => setProficiencyLevel(e.target.value as Proficiency | "")}
            className="flex-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5 text-xs"
          >
            <option value="">— level</option>
            {skillProficiencyValues.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={confidenceRating}
            onChange={(e) => setConfidenceRating(Number(e.target.value))}
            className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5 text-xs"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                conf {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 rounded-md border border-[var(--line)] py-1.5 text-xs text-[var(--mute)] hover:text-[var(--ink)]"
          >
            cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="flex-1 rounded-md bg-[var(--accent)] py-1.5 text-xs text-white disabled:opacity-50"
          >
            {busy ? "adding…" : "Add skill"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface SkillInventoryProps {
  skills: UserSkill[];
  onChange: (skills: UserSkill[]) => void;
}

export function SkillInventory({ skills, onChange }: SkillInventoryProps) {
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map: Record<Category, UserSkill[]> = {
      technical: [],
      soft: [],
      tool: [],
    };
    for (const s of skills) {
      const cat = (s.category as Category) ?? "technical";
      (map[cat] ?? map.technical).push(s);
    }
    return map;
  }, [skills]);

  function toggleSkill(id: string) {
    setActiveSkillId((prev) => (prev === id ? null : id));
  }

  async function saveSkill(id: string, patch: SkillUpdateInput): Promise<boolean> {
    const prev = skills;
    onChange(skills.map((s) => (s.id === id ? ({ ...s, ...patch } as UserSkill) : s)));
    try {
      await api.updateSkill(id, patch);
      return true;
    } catch (err) {
      onChange(prev);
      toast.error(err instanceof Error ? err.message : "Couldn't save change");
      return false;
    }
  }

  async function deleteSkill(id: string) {
    const prev = skills;
    const removed = skills.find((s) => s.id === id);
    onChange(skills.filter((s) => s.id !== id));
    if (activeSkillId === id) setActiveSkillId(null);
    try {
      await api.deleteSkill(id);
      if (removed) toast.success(`Removed ${removed.name}`);
    } catch (err) {
      onChange(prev);
      toast.error(err instanceof Error ? err.message : "Couldn't remove skill");
    }
  }

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
      {/* Header */}
      <div className="mb-1">
        <h2 className="text-sm font-semibold text-[var(--ink)]">Your skills</h2>
      </div>
      <p className="mb-4 text-xs text-[var(--mute)]">
        Everything you know how to do, grouped by type. Click a skill to edit its details —
        the <span className="text-[var(--ink)]">dots</span> inside each pill are your confidence (1–5).
        Faded italic skills haven&apos;t been used in 6+ months.
      </p>

      {/* Category sections */}
      <div className="mb-4 flex flex-col gap-5">
        {skillCategoryValues.map((cat) => {
          const catSkills = grouped[cat];
          const activeInSection = catSkills.find((s) => s.id === activeSkillId) ?? null;

          return (
            <div key={cat}>
              {/* Section header */}
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: CATEGORY_COLOR[cat] }}
                />
                <span className="mono text-[11px] text-[var(--mute)]">
                  {CATEGORY_LABEL[cat]}
                </span>
                <span className="mono text-[10px] text-[var(--mute-3)]">
                  {catSkills.length}
                </span>
              </div>

              {catSkills.length === 0 ? (
                <div className="rounded-md border border-dashed border-[var(--line)] px-3 py-2 text-center">
                  <span className="mono text-[10px] text-[var(--mute-3)]">none yet</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {catSkills.map((skill) => (
                    <SkillPill
                      key={skill.id}
                      skill={skill}
                      active={activeSkillId === skill.id}
                      onClick={() => toggleSkill(skill.id)}
                    />
                  ))}
                </div>
              )}

              {/* Inline drawer — only shown for the active skill in this section */}
              {activeInSection && (
                <SkillDrawer
                  skill={activeInSection}
                  onSave={(patch) => saveSkill(activeInSection.id, patch)}
                  onDelete={() => deleteSkill(activeInSection.id)}
                  onClose={() => setActiveSkillId(null)}
                />
              )}
            </div>
          );
        })}
      </div>

      <AddSkillForm onAdd={(skill) => onChange([...skills, skill])} />
    </div>
  );
}
