"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type {
  CareerJourney,
  CareerJourneySkillGap,
  UserSkill,
  UserLearningGoal,
} from "@kursa/types";
import { api } from "@/lib/api";

type GapStatus = "covered" | "in_progress" | "missing";

function classifyGap(
  gap: CareerJourneySkillGap,
  skills: UserSkill[],
  goals: UserLearningGoal[],
): GapStatus {
  const needle = gap.skill.toLowerCase();
  const skill = skills.find((s) => s.name.toLowerCase() === needle);
  if (
    skill &&
    (skill.proficiencyLevel === "advanced" ||
      skill.proficiencyLevel === "expert")
  ) {
    return "covered";
  }
  const hasGoal = goals.some((g) => g.skillName.toLowerCase() === needle);
  if (hasGoal) return "in_progress";
  return "missing";
}

const PRIORITY_BORDER: Record<string, string> = {
  high: "border-l-red-400",
  medium: "border-l-amber-400",
  low: "border-l-[var(--line)]",
};

const PRIORITY_TEXT: Record<string, string> = {
  high: "text-red-500",
  medium: "text-amber-500",
  low: "text-[var(--mute-3)]",
};

const STATUS_CHIP: Record<GapStatus, { label: string; className: string }> = {
  covered: { label: "covered ✓", className: "text-emerald-600 bg-emerald-50" },
  in_progress: { label: "in progress", className: "text-blue-600 bg-blue-50" },
  missing: {
    label: "missing",
    className: "text-[var(--mute-2)] bg-[var(--bg-sub-2)]",
  },
};

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
  const sc = STATUS_CHIP[status];
  const borderClass = PRIORITY_BORDER[gap.priority] ?? PRIORITY_BORDER.low;
  const priorityClass = PRIORITY_TEXT[gap.priority] ?? PRIORITY_TEXT.low;

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
    <div
      className={`rounded-lg border border-l-2 border-[var(--line)] bg-[var(--surface)] p-3 ${borderClass}`}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-snug text-[var(--ink)]">
          {gap.skill}
        </span>
        <span
          className={`mono shrink-0 rounded-full px-2 py-px text-[10px] ${sc.className}`}
        >
          {sc.label}
        </span>
      </div>

      <p className="mb-2.5 text-xs leading-relaxed text-[var(--mute)]">
        {gap.whyItMatters}
      </p>

      <div className="flex items-center justify-between">
        <span className={`mono text-[10px] ${priorityClass}`}>
          {gap.priority} priority
        </span>
        {status === "missing" && (
          <button
            type="button"
            onClick={handleTrack}
            disabled={busy}
            className="mono text-[11px] text-[var(--mute)] transition-colors hover:text-[var(--ink)] disabled:opacity-40"
          >
            {busy ? "adding…" : "track it →"}
          </button>
        )}
      </div>
    </div>
  );
}

interface SkillGapProps {
  activePath: CareerJourney | null;
  skills: UserSkill[];
  goals: UserLearningGoal[];
  onGoalAdded: (goal: UserLearningGoal) => void;
}

export function SkillGap({
  activePath,
  skills,
  goals,
  onGoalAdded,
}: SkillGapProps) {
  const gaps = activePath?.details?.skillGaps ?? [];

  const statuses = useMemo(
    () => gaps.map((g) => classifyGap(g, skills, goals)),
    [gaps, skills, goals],
  );

  const coveredCount = statuses.filter((s) => s === "covered").length;
  const inProgressCount = statuses.filter((s) => s === "in_progress").length;
  const missingCount = statuses.filter((s) => s === "missing").length;
  const total = gaps.length;

  if (!activePath) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-5">
        <div className="mb-1 text-sm font-semibold text-[var(--ink)]">
          Skill gaps
        </div>
        <p className="mb-1 text-sm text-[var(--mute)]">
          Once you have a career journey, this panel compares your current skills
          against what your target role actually requires.
        </p>
        <p className="mb-4 text-xs text-[var(--mute-2)]">
          Each gap shows why it matters and lets you add it to your learning queue with one click.
        </p>
        <Link
          href="/dashboard/career-journey"
          className="mono rounded-md border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--mute)] transition-colors hover:border-[var(--mute-3)] hover:text-[var(--ink)]"
        >
          set up your journey →
        </Link>
      </div>
    );
  }

  const confPct = Math.round(activePath.confidenceScore * 100);
  const timelineLabel =
    activePath.projectedTimelineMonths >= 12
      ? `${(activePath.projectedTimelineMonths / 12).toFixed(1)}yr`
      : `${activePath.projectedTimelineMonths}mo`;

  async function track(gap: CareerJourneySkillGap) {
    try {
      const { learningGoal } = await api.createLearningGoal({
        skillName: gap.skill,
        status: "PLANNED",
        position: goals.filter((goal) => goal.status === "PLANNED").length,
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
    <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]">
      {/* Path header */}
      <div className="border-b border-[var(--line)] bg-[var(--bg-sub)] p-4">
        <div className="mb-1 flex items-start justify-between gap-3">
          <h2 className="text-sm font-semibold leading-snug text-[var(--ink)]">
            {activePath.title}
          </h2>
          <div className="mono flex shrink-0 items-center gap-1.5 text-[10px] text-[var(--mute-2)]">
            <span>{confPct}% fit</span>
            <span className="text-[var(--mute-3)]">·</span>
            <span>{timelineLabel}</span>
          </div>
        </div>

        {activePath.description && (
          <p className="mb-3 text-xs leading-relaxed text-[var(--mute)]">
            {activePath.description}
          </p>
        )}

        {total > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-3">
              <span className="mono text-[10px] text-emerald-600">
                {coveredCount} covered
              </span>
              <span className="mono text-[10px] text-blue-500">
                {inProgressCount} in progress
              </span>
              <span className="mono text-[10px] text-[var(--mute-3)]">
                {missingCount} missing
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]">
              <div className="flex h-full">
                {coveredCount > 0 && (
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${(coveredCount / total) * 100}%` }}
                  />
                )}
                {inProgressCount > 0 && (
                  <div
                    className="h-full bg-blue-400 transition-all"
                    style={{ width: `${(inProgressCount / total) * 100}%` }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gap list */}
      <div className="p-4">
        {gaps.length === 0 ? (
          <p className="text-sm text-[var(--mute)]">
            No gap data for this path yet. Regenerate your journey to refresh.
          </p>
        ) : (
          <div className="mb-2 text-xs text-[var(--mute-2)]">
            Skills ranked by how much they matter for this path. Missing ones can be added to your learning queue below.
          </div>
        )}
        {gaps.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            {gaps.map((gap, i) => (
              <GapCard
                key={gap.skill}
                gap={gap}
                status={statuses[i]}
                onTrack={() => track(gap)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
