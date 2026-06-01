"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { UserSkill, SkillUpdateInput } from "@kursa/types";
import { skillCategoryValues, skillProficiencyValues } from "@kursa/types";
import { api } from "@/lib/api";

type Category = (typeof skillCategoryValues)[number];
type Proficiency = (typeof skillProficiencyValues)[number];

const CATEGORY_LABEL: Record<Category, string> = {
  technical: "technical",
  soft: "soft",
  tool: "tools",
};

const CONFIDENCE_WORDS: Record<number, string> = {
  1: "shaky",
  2: "learning",
  3: "comfortable",
  4: "confident",
  5: "very confident",
};

const DORMANT_MONTHS = 6;

interface SkillInventoryProps {
  skills: UserSkill[];
  onChange: (skills: UserSkill[]) => void;
}

function monthsSince(date: string | Date | null): number | null {
  if (!date) return null;
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return null;
  return (Date.now() - then) / (1000 * 60 * 60 * 24 * 30.44);
}

function recencyLabel(date: string | Date | null): string {
  const months = monthsSince(date);
  if (months === null) return "";
  if (months < 1) return "used now";
  if (months < 12) return `${Math.round(months)}mo ago`;
  return `${Math.floor(months / 12)}yr ago`;
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

const ROW_GRID = "minmax(0,1fr) 150px 88px 112px 20px";

function ConfidenceControl({
  value,
  onSet,
}: {
  value: number | null;
  onSet: (v: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const filled = hovered ?? value ?? 0;
  const word = value ? CONFIDENCE_WORDS[value] : "not set";
  return (
    <div className="flex items-center gap-2" title="How confident you feel (1–5)">
      <div className="flex gap-0.5" onMouseLeave={() => setHovered(null)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`Set confidence to ${n} of 5`}
            onMouseEnter={() => setHovered(n)}
            onClick={() => onSet(n)}
            className="h-2.5 w-3.5 rounded-[2px] transition-colors"
            style={{ background: n <= filled ? "var(--accent)" : "var(--line)" }}
          />
        ))}
      </div>
      <span
        className="mono whitespace-nowrap"
        style={{ fontSize: 11, color: value ? "var(--mute)" : "var(--mute-3)" }}
      >
        {value ? `${value}/5` : "—"}
      </span>
    </div>
  );
}

function LastUsedControl({
  skill,
  onSet,
}: {
  skill: UserSkill;
  onSet: (iso: string | null) => void;
}) {
  const label = recencyLabel(skill.lastUsedDate);
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="date"
        value={toDateInputValue(skill.lastUsedDate)}
        max={new Date().toISOString().slice(0, 10)}
        onChange={(e) =>
          onSet(e.target.value ? new Date(e.target.value).toISOString() : null)
        }
        className="mono rounded-md border border-[var(--line)] bg-[var(--surface)] px-1 py-0.5 text-[11px] text-[var(--mute)]"
        title="When did you last use this skill?"
      />
      <span className="mono text-[11px]" style={{ color: "var(--mute-3)" }}>
        {label}
      </span>
    </div>
  );
}

function SkillRow({
  skill,
  onSave,
  onDelete,
}: {
  skill: UserSkill;
  onSave: (patch: SkillUpdateInput) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const dormant = isDormant(skill);

  async function save(patch: SkillUpdateInput) {
    const ok = await onSave(patch);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1400);
    }
  }

  return (
    <div
      className="grid items-center gap-2 py-1"
      style={{ gridTemplateColumns: ROW_GRID }}
    >
      <span
        className="flex items-center gap-1.5 truncate text-sm"
        style={{ color: dormant ? "var(--mute-3)" : "var(--ink)" }}
        title={dormant ? `${skill.name} — dormant (not used in 6+ months)` : skill.name}
      >
        <span className="truncate">{skill.name}</span>
        {saved && (
          <span className="mono" style={{ fontSize: 9, color: "var(--accent)" }}>
            ✓ saved
          </span>
        )}
      </span>

      <ConfidenceControl
        value={skill.confidenceRating}
        onSet={(v) => save({ confidenceRating: v })}
      />

      <select
        value={skill.proficiencyLevel ?? ""}
        onChange={(e) => save({ proficiencyLevel: (e.target.value || null) as Proficiency | null })}
        className="rounded-md border border-[var(--line)] bg-transparent px-1.5 py-0.5"
        style={{ fontSize: 11, color: skill.proficiencyLevel ? "var(--mute)" : "var(--mute-3)" }}
        title="Your actual mastery level"
      >
        <option value="">— set level</option>
        {skillProficiencyValues.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <LastUsedControl skill={skill} onSet={(iso) => save({ lastUsedDate: iso })} />

      <button
        type="button"
        onClick={onDelete}
        aria-label={`Remove ${skill.name}`}
        className="text-[var(--mute-3)] hover:text-[var(--ink)]"
      >
        ×
      </button>
    </div>
  );
}

function AddSkillForm({ onAdd }: { onAdd: (skill: UserSkill) => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("technical");
  const [confidenceRating, setConfidenceRating] = useState(3);
  const [proficiencyLevel, setProficiencyLevel] = useState<Proficiency | "">("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed) { toast.error("Enter a skill name first"); return; }
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
      toast.success(`Added ${skill.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add skill");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-[var(--line)] pt-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Skill name…"
        className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-sm"
      />
      <div className="flex items-center gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5 text-xs"
          title="Category"
        >
          {skillCategoryValues.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={confidenceRating}
          onChange={(e) => setConfidenceRating(Number(e.target.value))}
          className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5 text-xs"
          title="Confidence (1–5)"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              conf {n}
            </option>
          ))}
        </select>
        <select
          value={proficiencyLevel}
          onChange={(e) => setProficiencyLevel(e.target.value as Proficiency | "")}
          className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5 text-xs"
          title="Level (optional)"
        >
          <option value="">— level</option>
          {skillProficiencyValues.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="ml-auto rounded-md bg-[var(--accent)] px-4 py-1.5 text-sm text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export function SkillInventory({ skills, onChange }: SkillInventoryProps) {
  const grouped = useMemo(() => {
    const map: Record<Category, UserSkill[]> = { technical: [], soft: [], tool: [] };
    for (const s of skills) {
      const cat = (s.category as Category) ?? "technical";
      (map[cat] ?? map.technical).push(s);
    }
    return map;
  }, [skills]);

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
      <h2 className="text-sm font-semibold text-[var(--ink)]">Your skills</h2>
      <p className="mb-3 text-xs text-[var(--mute)]">
        <span className="font-medium">Confidence</span> is how sure you feel (1–5).{" "}
        <span className="font-medium">Level</span> is your actual mastery.{" "}
        <span className="font-medium">Last used</span> tracks recency — skills idle 6+
        months fade.
      </p>

      {skills.length === 0 ? (
        <p className="text-sm text-[var(--mute)]">
          No skills yet — add your first one below.
        </p>
      ) : (
        <>
          {/* Column header */}
          <div
            className="mono mb-1 grid items-center gap-2 border-b border-[var(--line)] pb-1 text-[11px]"
            style={{ gridTemplateColumns: ROW_GRID, color: "var(--mute-3)" }}
          >
            <span>skill</span>
            <span>confidence</span>
            <span>level</span>
            <span>last used</span>
            <span />
          </div>

          {skillCategoryValues.map((cat) =>
            grouped[cat].length === 0 ? null : (
              <div key={cat} className="mb-4">
                <div
                  className="mono mb-1 flex items-center justify-between pt-1"
                  style={{ fontSize: 9.5, color: "var(--mute)" }}
                >
                  <span>{CATEGORY_LABEL[cat]}</span>
                  <span>{grouped[cat].length}</span>
                </div>
                {grouped[cat].map((skill) => (
                  <SkillRow
                    key={skill.id}
                    skill={skill}
                    onSave={(patch) => saveSkill(skill.id, patch)}
                    onDelete={() => deleteSkill(skill.id)}
                  />
                ))}
              </div>
            ),
          )}
        </>
      )}

      <AddSkillForm onAdd={(skill) => onChange([...skills, skill])} />
    </div>
  );
}
