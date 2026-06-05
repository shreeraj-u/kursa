"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import type {
  SkillProposalSummary,
  SkillsOverviewResponse,
  UserSkill,
} from "@kursa/types";
import { skillCategoryValues, skillProficiencyValues } from "@kursa/types";

import PageHeader from "@/components/dashboard/page-header";
import PageHelpButton from "@/components/dashboard/page-help-button";
import { DASHBOARD_PAGE_HELP } from "@/components/dashboard/page-help";
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

const PROFICIENCY_LABEL: Record<Proficiency, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

const SOURCE_LABEL: Record<string, string> = {
  github: "GitHub",
  market: "Market",
  chat: "Aria",
  journal: "Journal",
  path: "Path",
};

// ---- ProposalsFeed ----

function ProposalsFeed({
  proposals,
  onChange,
  onSkillAdded,
}: {
  proposals: SkillProposalSummary[];
  onChange: (next: SkillProposalSummary[]) => void;
  onSkillAdded: (skill: UserSkill) => void;
}) {
  async function accept(id: string) {
    try {
      const { skill } = await api.skills.acceptProposal(id);
      onChange(proposals.filter((p) => p.id !== id));
      if (skill) onSkillAdded(skill as unknown as UserSkill);
      toast.success("Skill confirmed");
    } catch {
      toast.error("Could not confirm skill");
    }
  }

  async function dismiss(id: string) {
    try {
      await api.skills.dismissProposal(id);
      onChange(proposals.filter((p) => p.id !== id));
    } catch {
      toast.error("Could not dismiss");
    }
  }

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--ink)]">Skill suggestions</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--mute)]">
            Aria spotted these from your activity. Confirm what fits, dismiss what doesn&apos;t.
          </p>
        </div>
        {proposals.length > 0 && (
          <span className="mono shrink-0 rounded-full border border-[var(--accent-line)] bg-[var(--accent-soft)] px-2 py-1 text-[10px] text-[var(--accent)]">
            {proposals.length} pending
          </span>
        )}
      </div>

      {proposals.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--line)] px-4 py-8 text-center">
          <p className="mono text-xs text-[var(--mute-3)]">No pending suggestions</p>
          <p className="mt-1 text-[11px] text-[var(--mute-3)]">
            Aria will surface skills as you journal, chat, and connect GitHub.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {proposals.map((p) => (
            <div
              key={p.id}
              className="flex items-start gap-3 rounded-lg border border-[var(--line)] bg-[var(--bg-sub)] p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-[var(--ink)]">{p.displayName}</span>
                  <span className="mono rounded border border-[var(--line)] px-1.5 py-px text-[9px] text-[var(--mute)]">
                    {SOURCE_LABEL[p.source] ?? p.source}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--mute)]">{p.evidence}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void accept(p.id)}
                  className="mono rounded-md px-2.5 py-1.5 text-[10px] text-white"
                  style={{ background: "var(--accent)", cursor: "pointer" }}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => void dismiss(p.id)}
                  className="mono rounded-md border border-[var(--line)] bg-transparent px-2.5 py-1.5 text-[10px] text-[var(--mute)]"
                  style={{ cursor: "pointer" }}
                >
                  Not me
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- SkillRow ----

function SkillRow({
  skill,
  onDelete,
}: {
  skill: UserSkill;
  onDelete: () => void;
}) {
  const proficiency = skill.proficiencyLevel as Proficiency | null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--bg-sub)] px-3 py-2.5">
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: CATEGORY_COLOR[(skill.category as Category) ?? "technical"] }}
      />
      <span className="min-w-0 flex-1 truncate text-sm text-[var(--ink)]" title={skill.name}>
        {skill.name}
      </span>
      {proficiency && (
        <span className="mono shrink-0 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2 py-px text-[10px] text-[var(--mute)]">
          {PROFICIENCY_LABEL[proficiency]}
        </span>
      )}
      {skill.confidenceRating != null && (
        <span className="mono shrink-0 text-[10px] text-[var(--mute-3)]">
          {skill.confidenceRating}/5
        </span>
      )}
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Remove ${skill.name}`}
        className="mono shrink-0 rounded border border-transparent px-1.5 py-1 text-[11px] text-[var(--mute-3)] transition-colors hover:border-[var(--line)] hover:text-red-500"
      >
        ×
      </button>
    </div>
  );
}

// ---- AriaSkillInput ----

type AriaResult = { action: "added" | "updated"; skill: UserSkill };

function AriaSkillInput({
  onResult,
}: {
  onResult: (results: AriaResult[]) => void;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastResults, setLastResults] = useState<AriaResult[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit() {
    const trimmed = value.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setLastResults(null);
    try {
      const { actions } = await api.skills.interpret(trimmed);
      onResult(actions);
      setLastResults(actions);
      setValue("");
      inputRef.current?.focus();
    } catch {
      toast.error("Aria couldn't process that — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 border-b border-[var(--line)] pb-4">
      <p className="mb-2 text-[11px] text-[var(--mute)]">
        Tell Aria how your skills changed, or ask to add one.
      </p>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
          placeholder="e.g. &quot;I've been writing TypeScript professionally&quot; or &quot;add Docker as a tool&quot;"
          disabled={busy}
          className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--bg-sub)] px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--mute-3)] focus:border-[var(--accent)] focus:outline-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy || !value.trim()}
          className="mono rounded-lg px-3 py-2 text-xs text-white transition-opacity disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          {busy ? "…" : "Ask Aria"}
        </button>
      </div>
      {lastResults && lastResults.length > 0 && (
        <div className="mt-2 rounded-lg border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-2">
          {lastResults.map((r, i) => (
            <p key={i} className="mono text-[11px] text-[var(--accent)]">
              {r.action === "added" ? "+" : "↑"} {r.skill.name}
              {r.skill.proficiencyLevel ? ` → ${PROFICIENCY_LABEL[r.skill.proficiencyLevel as Proficiency]}` : ""}
              {r.skill.confidenceRating != null ? ` · ${r.skill.confidenceRating}/5` : ""}
            </p>
          ))}
        </div>
      )}
      {lastResults && lastResults.length === 0 && (
        <p className="mono mt-2 text-[11px] text-[var(--mute-3)]">
          Aria didn&apos;t find anything to update — try being more specific.
        </p>
      )}
    </div>
  );
}

// ---- SkillList ----

function SkillList({
  skills,
  onChange,
}: {
  skills: UserSkill[];
  onChange: (skills: UserSkill[]) => void;
}) {
  const grouped = skillCategoryValues.reduce<Record<Category, UserSkill[]>>(
    (acc, cat) => {
      acc[cat] = skills.filter((s) => (s.category as Category) === cat);
      return acc;
    },
    { technical: [], soft: [], tool: [] },
  );

  async function handleDelete(id: string) {
    const prev = skills;
    const removed = skills.find((s) => s.id === id);
    onChange(skills.filter((s) => s.id !== id));
    try {
      await api.deleteSkill(id);
      if (removed) toast.success(`Removed ${removed.name}`);
    } catch {
      onChange(prev);
      toast.error("Could not remove skill");
    }
  }

  function handleAriaResult(results: AriaResult[]) {
    onChange(
      results.reduce((acc, r) => {
        const existing = acc.find((s) => s.id === r.skill.id);
        if (existing) return acc.map((s) => (s.id === r.skill.id ? r.skill : s));
        return [r.skill, ...acc];
      }, skills),
    );
  }

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--ink)]">Your skills</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--mute)]">
            Grouped by category · tell Aria below to update levels or add new ones
          </p>
        </div>
        <span className="mono shrink-0 rounded-full bg-[var(--bg-sub)] px-2 py-1 text-[10px] text-[var(--mute-3)]">
          {skills.length} total
        </span>
      </div>

      <AriaSkillInput onResult={handleAriaResult} />

      {skills.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--line)] px-4 py-8 text-center">
          <p className="mono text-xs text-[var(--mute-3)]">
            No skills yet — confirm a suggestion or tell Aria above.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {skillCategoryValues.map((cat) => {
            const catSkills = grouped[cat];
            if (catSkills.length === 0) return null;
            return (
              <section key={cat}>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: CATEGORY_COLOR[cat] }}
                  />
                  <span className="mono text-[10px] text-[var(--mute)]">{CATEGORY_LABEL[cat]}</span>
                  <span className="mono text-[10px] text-[var(--mute-3)]">· {catSkills.length}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {catSkills.map((skill) => (
                    <SkillRow
                      key={skill.id}
                      skill={skill}
                      onDelete={() => void handleDelete(skill.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- SkillsStudio ----

interface SkillsStudioProps {
  initialSkills: UserSkill[];
  initialOverview?: SkillsOverviewResponse | null;
}

export function SkillsStudio({
  initialSkills,
  initialOverview = null,
}: SkillsStudioProps) {
  const [skills, setSkills] = useState<UserSkill[]>(initialSkills);
  const [proposals, setProposals] = useState<SkillProposalSummary[]>(
    initialOverview?.proposals ?? [],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          pageTitle="Skills"
          breadcrumb="Workspace"
        />
        <PageHelpButton help={DASHBOARD_PAGE_HELP.skills} label="Skills" />
      </div>

      <ProposalsFeed
        proposals={proposals}
        onChange={setProposals}
        onSkillAdded={(skill) => setSkills((prev) => [skill, ...prev])}
      />

      <SkillList skills={skills} onChange={setSkills} />
    </div>
  );
}
