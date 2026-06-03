"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { UserSkill, SkillUpdateInput } from "@kursa/types";
import { skillCategoryValues, skillProficiencyValues } from "@kursa/types";
import { api } from "@/lib/api";

type Category = (typeof skillCategoryValues)[number];
type Proficiency = (typeof skillProficiencyValues)[number];
type Filter = "all" | "missing_level" | "dormant";
type SortMode = "needs_review" | "az" | "level" | "confidence";

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

const PROFICIENCY_LABEL: Record<Proficiency, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

const PROFICIENCY_HELP: Record<Proficiency, string> = {
  beginner: "You can use it with guidance or tutorials.",
  intermediate: "You can ship routine work independently.",
  advanced: "You can design solutions and unblock others.",
  expert: "You can set standards, teach, and handle edge cases.",
};

const CONFIDENCE_HELP: Record<number, string> = {
  1: "Need support",
  2: "Some confidence",
  3: "Comfortable",
  4: "Strong confidence",
  5: "Very confident",
};

const SOURCE_LABEL: Record<string, string> = {
  self_reported: "Self-reported",
  resume: "From résumé",
  inferred: "Inferred",
};

const DORMANT_MONTHS = 6;
const PROFICIENCY_RANK: Record<Proficiency, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

function monthsSince(date: string | Date | null): number | null {
  if (!date) return null;
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return null;
  return (Date.now() - then) / (1000 * 60 * 60 * 24 * 30.44);
}

function recencyLabel(date: string | Date | null): string {
  const months = monthsSince(date);
  if (months === null) return "Not observed yet";
  if (months < 1) return "Used recently";
  if (months < 12) return `Used ${Math.round(months)}mo ago`;
  return `Used ${Math.floor(months / 12)}yr ago`;
}

function isDormant(skill: UserSkill): boolean {
  const months = monthsSince(skill.lastUsedDate);
  return months !== null && months >= DORMANT_MONTHS;
}

function needsReviewScore(skill: UserSkill): number {
  if (!skill.proficiencyLevel) return 0;
  if (isDormant(skill)) return 1;
  if (!skill.confidenceRating) return 2;
  return 3;
}

function sortSkillList(skills: UserSkill[], mode: SortMode) {
  return [...skills].sort((a, b) => {
    if (mode === "needs_review") {
      const review = needsReviewScore(a) - needsReviewScore(b);
      if (review !== 0) return review;
    }
    if (mode === "level") {
      const level =
        (PROFICIENCY_RANK[b.proficiencyLevel as Proficiency] ?? 0) -
        (PROFICIENCY_RANK[a.proficiencyLevel as Proficiency] ?? 0);
      if (level !== 0) return level;
    }
    if (mode === "confidence") {
      const confidence = (b.confidenceRating ?? 0) - (a.confidenceRating ?? 0);
      if (confidence !== 0) return confidence;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

function sourceLabel(skill: UserSkill): string {
  const source = "source" in skill ? (skill.source as string | null | undefined) : null;
  if (!source) return "Source not recorded";
  return SOURCE_LABEL[source] ?? source.replaceAll("_", " ");
}

function SkillCard({
  skill,
  expanded,
  onToggle,
  onSave,
  onDelete,
}: {
  skill: UserSkill;
  expanded: boolean;
  onToggle: () => void;
  onSave: (patch: SkillUpdateInput) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [draftName, setDraftName] = useState(skill.name);
  const dormant = isDormant(skill);
  const proficiency = skill.proficiencyLevel as Proficiency | null;
  const confidence = skill.confidenceRating ?? 0;

  async function saveName() {
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === skill.name) {
      setDraftName(skill.name);
      return;
    }
    const ok = await onSave({ name: trimmed });
    if (!ok) setDraftName(skill.name);
  }

  return (
    <div
      className={`rounded-lg border border-[var(--line)] bg-[var(--bg-sub)] p-3 transition-colors ${expanded ? "xl:col-span-2" : ""}`}
      style={{ opacity: dormant && !expanded ? 0.7 : 1 }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 text-left"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: CATEGORY_COLOR[(skill.category as Category) ?? "technical"] }}
            />
            <span className="truncate text-sm font-semibold text-[var(--ink)]">
              {skill.name}
            </span>
            {proficiency ? (
              <span className="mono rounded-full bg-[var(--surface)] px-2 py-px text-[10px] text-[var(--mute)]">
                {PROFICIENCY_LABEL[proficiency]}
              </span>
            ) : (
              <span className="mono rounded-full bg-amber-50 px-2 py-px text-[10px] text-amber-700">
                add level
              </span>
            )}
            {dormant && (
              <span className="mono rounded-full bg-[var(--surface)] px-2 py-px text-[10px] text-[var(--mute-3)]">
                dormant
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--mute)]">
            <span>{CATEGORY_LABEL[(skill.category as Category) ?? "technical"]}</span>
            <span className="text-[var(--mute-3)]">·</span>
            <span>Confidence {confidence || "not set"}/5</span>
            <span className="text-[var(--mute-3)]">·</span>
            <span>{recencyLabel(skill.lastUsedDate)}</span>
          </div>
        </div>
        <span className="mono shrink-0 text-[11px] text-[var(--mute-3)]">
          {expanded ? "close" : "details"}
        </span>
      </button>

      {expanded && (
        <div className="mt-4 border-t border-[var(--line)] pt-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="mono text-[10px] text-[var(--mute-3)]">skill name</span>
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") setDraftName(skill.name);
                }}
                className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="mono text-[10px] text-[var(--mute-3)]">category</span>
              <select
                value={(skill.category as Category) ?? "technical"}
                onChange={(e) => onSave({ category: e.target.value as Category })}
                className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-sm"
              >
                {skillCategoryValues.map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_LABEL[cat]}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[var(--ink)]">Confidence</span>
                <span className="mono text-[10px] text-[var(--mute-3)]">
                  {confidence ? CONFIDENCE_HELP[confidence] : "not set"}
                </span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    title={`Set confidence to ${n}: ${CONFIDENCE_HELP[n]}`}
                    onClick={() => onSave({ confidenceRating: n })}
                    className="h-7 flex-1 rounded-md border text-xs transition-colors"
                    style={{
                      borderColor: n <= confidence ? "var(--accent)" : "var(--line)",
                      background: n <= confidence ? "var(--accent)" : "transparent",
                      color: n <= confidence ? "white" : "var(--mute)",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--mute)]">
                How self-assured you feel using this skill right now.
              </p>
            </div>

            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[var(--ink)]">Proficiency</span>
                <span className="mono text-[10px] text-[var(--mute-3)]">
                  actual mastery
                </span>
              </div>
              <select
                value={proficiency ?? ""}
                onChange={(e) => onSave({ proficiencyLevel: (e.target.value || null) as Proficiency | null })}
                className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-sub)] px-3 py-1.5 text-sm"
              >
                <option value="">Choose level…</option>
                {skillProficiencyValues.map((level) => (
                  <option key={level} value={level}>{PROFICIENCY_LABEL[level]}</option>
                ))}
              </select>
              <p className="mt-2 text-xs leading-relaxed text-[var(--mute)]">
                {proficiency ? PROFICIENCY_HELP[proficiency] : "Pick the level that best reflects what you can do independently."}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface)] p-3 text-xs text-[var(--mute)] md:grid-cols-2">
            <div>
              <span className="mono text-[10px] text-[var(--mute-3)]">recency</span>
              <div className="mt-1 text-[var(--ink)]">{recencyLabel(skill.lastUsedDate)}</div>
              <p className="mt-1 leading-relaxed">Kursa updates last-used signals from later profile activity; it is read-only here.</p>
            </div>
            <div>
              <span className="mono text-[10px] text-[var(--mute-3)]">source</span>
              <div className="mt-1 text-[var(--ink)]">{sourceLabel(skill)}</div>
              <p className="mt-1 leading-relaxed">Use this to distinguish imported, inferred, and self-reported skills.</p>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onDelete}
              className="mono rounded-md border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--mute)] transition-colors hover:border-red-300 hover:text-red-500"
            >
              remove skill
            </button>
          </div>
        </div>
      )}
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
        className="mono w-full rounded-lg border border-dashed border-[var(--line)] py-3 text-xs text-[var(--mute)] transition-colors hover:border-[var(--mute-3)] hover:text-[var(--ink)]"
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
        <div className="grid gap-2 md:grid-cols-3">
          <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5 text-xs">
            {skillCategoryValues.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
          </select>
          <select value={proficiencyLevel} onChange={(e) => setProficiencyLevel(e.target.value as Proficiency | "")} className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5 text-xs">
            <option value="">— level</option>
            {skillProficiencyValues.map((p) => <option key={p} value={p}>{PROFICIENCY_LABEL[p]}</option>)}
          </select>
          <select value={confidenceRating} onChange={(e) => setConfidenceRating(Number(e.target.value))} className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5 text-xs">
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>confidence {n}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-md border border-[var(--line)] py-1.5 text-xs text-[var(--mute)] hover:text-[var(--ink)]">cancel</button>
          <button type="button" onClick={submit} disabled={busy} className="flex-1 rounded-md bg-[var(--accent)] py-1.5 text-xs text-white disabled:opacity-50">{busy ? "adding…" : "Add skill"}</button>
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
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("needs_review");

  const visibleSkills = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return skills.filter((skill) => {
      const matchesQuery = !needle || skill.name.toLowerCase().includes(needle);
      const matchesFilter =
        filter === "all" ||
        (filter === "missing_level" && !skill.proficiencyLevel) ||
        (filter === "dormant" && isDormant(skill));
      return matchesQuery && matchesFilter;
    });
  }, [skills, query, filter]);

  const grouped = useMemo(() => {
    const map: Record<Category, UserSkill[]> = { technical: [], soft: [], tool: [] };
    for (const s of visibleSkills) {
      const cat = (s.category as Category) ?? "technical";
      (map[cat] ?? map.technical).push(s);
    }
    for (const cat of skillCategoryValues) {
      map[cat] = sortSkillList(map[cat], sortMode);
    }
    return map;
  }, [visibleSkills, sortMode]);

  async function saveSkill(id: string, patch: SkillUpdateInput): Promise<boolean> {
    const prev = skills;
    onChange(skills.map((s) => (s.id === id ? ({ ...s, ...patch } as UserSkill) : s)));
    try {
      const { skill } = await api.updateSkill(id, patch);
      onChange(skills.map((s) => (s.id === id ? skill : s)));
      toast.success("Skill updated");
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
    if (expandedSkillId === id) setExpandedSkillId(null);
    try {
      await api.deleteSkill(id);
      if (removed) toast.success(`Removed ${removed.name}`);
    } catch (err) {
      onChange(prev);
      toast.error(err instanceof Error ? err.message : "Couldn't remove skill");
    }
  }

  const missingLevel = skills.filter((s) => !s.proficiencyLevel).length;
  const dormantCount = skills.filter(isDormant).length;

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[var(--ink)]">Your skill inventory</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--mute)]">
            Review what belongs in your Profile. Confidence is how sure you feel; proficiency is what you can do. Expand any skill to fill the details recruiters and Kursa need.
          </p>
        </div>
        <div className="mono rounded-lg border border-[var(--line)] bg-[var(--bg-sub)] px-3 py-2 text-[10px] text-[var(--mute)]">
          {missingLevel} need level · {dormantCount} dormant
        </div>
      </div>

      <div className="mb-4 grid gap-2 lg:grid-cols-[1fr_auto_auto]">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skills…"
          className="rounded-md border border-[var(--line)] bg-[var(--bg-sub)] px-3 py-2 text-sm"
        />
        <div className="flex rounded-md border border-[var(--line)] bg-[var(--bg-sub)] p-1">
          {([
            ["all", "All"],
            ["missing_level", "Needs level"],
            ["dormant", "Dormant"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded px-2 py-1 text-xs transition-colors ${filter === value ? "bg-[var(--ink)] text-[var(--bg)]" : "text-[var(--mute)] hover:text-[var(--ink)]"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--bg-sub)] px-2">
          <span className="mono text-[10px] text-[var(--mute-3)]">sort</span>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="bg-transparent py-2 text-xs text-[var(--mute)] outline-none"
          >
            <option value="needs_review">Needs review</option>
            <option value="az">A–Z</option>
            <option value="level">Highest level</option>
            <option value="confidence">Most confident</option>
          </select>
        </label>
      </div>

      <div className="mb-4 rounded-lg border border-dashed border-[var(--line)] bg-[var(--bg-sub)] p-3 text-xs leading-relaxed text-[var(--mute)]">
        <span className="font-medium text-[var(--ink)]">How to read this:</span> use confidence for how ready you feel today, proficiency for actual mastery, and recency to spot skills Kursa has not seen in recent profile activity.
      </div>

      <div className="mb-4 flex flex-col gap-5">
        {skillCategoryValues.map((cat) => {
          const catSkills = grouped[cat];
          const catMissing = catSkills.filter((skill) => !skill.proficiencyLevel).length;
          const catDormant = catSkills.filter(isDormant).length;
          return (
            <section key={cat}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--line)] bg-[var(--bg-sub)] px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CATEGORY_COLOR[cat] }} />
                  <span className="mono text-[11px] text-[var(--mute)]">{CATEGORY_LABEL[cat]}</span>
                  <span className="mono rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] text-[var(--mute-3)]">{catSkills.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  {catMissing > 0 && (
                    <span className="mono rounded-full bg-amber-50 px-2 py-0.5 text-[9px] text-amber-700">
                      {catMissing} need level
                    </span>
                  )}
                  {catDormant > 0 && (
                    <span className="mono rounded-full bg-[var(--surface)] px-2 py-0.5 text-[9px] text-[var(--mute-3)]">
                      {catDormant} dormant
                    </span>
                  )}
                </div>
              </div>

              {catSkills.length === 0 ? (
                <div className="rounded-md border border-dashed border-[var(--line)] px-3 py-3 text-center">
                  <span className="mono text-[10px] text-[var(--mute-3)]">No matching skills</span>
                </div>
              ) : (
                <div className="grid gap-2 xl:grid-cols-2">
                  {catSkills.map((skill) => (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      expanded={expandedSkillId === skill.id}
                      onToggle={() => setExpandedSkillId((prev) => (prev === skill.id ? null : skill.id))}
                      onSave={(patch) => saveSkill(skill.id, patch)}
                      onDelete={() => deleteSkill(skill.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <AddSkillForm onAdd={(skill) => onChange([...skills, skill])} />
    </div>
  );
}
