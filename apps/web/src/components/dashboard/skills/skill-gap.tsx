"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { CareerJourney, CareerJourneySkillGap, UserSkill, UserLearningGoal } from "@kursa/types";
import { api } from "@/lib/api";

type GapStatus = "covered" | "in_progress" | "missing";

function classifyGap(
  gap: CareerJourneySkillGap,
  skills: UserSkill[],
  goals: UserLearningGoal[],
): GapStatus {
  const needle = gap.skill.toLowerCase();
  const skill = skills.find((s) => s.name.toLowerCase() === needle);
  if (skill && (skill.proficiencyLevel === "advanced" || skill.proficiencyLevel === "expert")) {
    return "covered";
  }
  const hasGoal = goals.some((g) => g.skillName.toLowerCase() === needle);
  if (hasGoal) return "in_progress";
  return "missing";
}

const STATUS_LABEL: Record<GapStatus, string> = {
  covered: "covered ✓",
  in_progress: "in progress",
  missing: "missing",
};

const PRIORITY_COLOR: Record<string, string> = {
  high: "text-red-500 border-red-200",
  medium: "text-amber-500 border-amber-200",
  low: "text-[var(--mute-2)] border-[var(--line)]",
};

interface SkillGapProps {
  activePath: CareerJourney | null;
  skills: UserSkill[];
  goals: UserLearningGoal[];
  onGoalAdded: (goal: UserLearningGoal) => void;
}

function GapCard({
  gap,
  status,
  onTrack,
}: {
  gap: CareerJourneySkillGap;
  status: GapStatus;
  onTrack: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  async function handleTrack() {
    if (busy) return;
    setBusy(true);
    try {
      await onTrack();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-md border border-[var(--line)] bg-[var(--bg-sub-2)] p-3">
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className="text-xs text-[var(--ink)] font-medium">{gap.skill}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className={`mono text-2xs border rounded-full px-1.5 py-px ${PRIORITY_COLOR[gap.priority] ?? PRIORITY_COLOR.low}`}
          >
            {gap.priority}
          </span>
          <span
            className={`mono text-2xs border rounded-full px-1.5 py-px ${
              status === "covered"
                ? "text-green-600 border-green-200"
                : status === "in_progress"
                  ? "text-blue-500 border-blue-200"
                  : "text-[var(--mute-2)] border-[var(--line)]"
            }`}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>
      </div>
      <div className="text-xs text-[var(--mute-2)] mb-2">{gap.whyItMatters}</div>
      {status === "missing" && (
        <button
          type="button"
          onClick={handleTrack}
          disabled={busy}
          className="mono text-2xs border border-[var(--line)] rounded px-2 py-0.5 text-[var(--mute)] hover:text-[var(--ink)] hover:border-[var(--mute)] disabled:opacity-40 transition-colors"
        >
          {busy ? "adding…" : "track it →"}
        </button>
      )}
    </div>
  );
}

export function SkillGap({ activePath, skills, goals, onGoalAdded }: SkillGapProps) {
  if (!activePath) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-4">
        <div className="mb-1 text-sm font-semibold text-[var(--ink)]">Gap to your journey</div>
        <p className="text-sm text-[var(--mute)] mb-3">
          Generate a career journey to see your skill gaps here.
        </p>
        <Link
          href="/dashboard/career-journey"
          className="mono text-2xs border border-[var(--line)] rounded px-2 py-1 text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
        >
          start your journey →
        </Link>
      </div>
    );
  }

  const gaps = activePath.details?.skillGaps ?? [];

  if (gaps.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-4">
        <div className="mb-1 text-sm font-semibold text-[var(--ink)]">Gap to chosen path</div>
        <p className="text-sm text-[var(--mute)]">
          No gaps generated for this path. Regenerate paths to refresh.
        </p>
      </div>
    );
  }

  async function track(gap: CareerJourneySkillGap) {
    try {
      const { learningGoal } = await api.createLearningGoal({
        skillName: gap.skill,
        gapPriority: gap.priority,
        pathTitle: activePath?.title,
        whyItMatters: gap.whyItMatters,
      });
      onGoalAdded(learningGoal);
      toast.success(`"${gap.skill}" added to learning goals`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add goal");
      throw err;
    }
  }

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
      <div className="mb-1 text-sm font-semibold text-[var(--ink)]">Gap to chosen path</div>
      <p className="mono text-2xs text-[var(--mute-2)] mb-3 truncate" title={activePath.title}>
        {activePath.title}
      </p>
      <div className="flex flex-col gap-2">
        {gaps.map((gap) => (
          <GapCard
            key={gap.skill}
            gap={gap}
            status={classifyGap(gap, skills, goals)}
            onTrack={() => track(gap)}
          />
        ))}
      </div>
    </div>
  );
}
