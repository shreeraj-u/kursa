import { Check } from "lucide-react";
import type { JourneyMilestone } from "@kursa/types";

interface MilestoneNodeProps {
  milestone: JourneyMilestone;
  isLast: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

function estimatedDate(monthsFromNow: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsFromNow);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function StatusCircle({ status, selected }: { status: JourneyMilestone["status"]; selected: boolean }) {
  if (status === "completed") {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent">
        <Check size={10} className="text-white" />
      </div>
    );
  }
  if (status === "in_progress") {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-accent bg-[var(--accent-soft)]">
        <div className="h-1.5 w-1.5 rounded-full bg-accent" />
      </div>
    );
  }
  return (
    <div
      className={`h-5 w-5 shrink-0 rounded-full border-2 ${
        selected ? "border-accent bg-[var(--accent-soft)]" : "border-line-2 bg-surface"
      }`}
    />
  );
}

function formatSalary(milestone: JourneyMilestone): string | null {
  if (milestone.salaryBand.max <= 0) return null;
  return `$${(milestone.salaryBand.min / 1000).toFixed(0)}k–${(milestone.salaryBand.max / 1000).toFixed(0)}k`;
}

export default function MilestoneNode({ milestone, isLast, isSelected, onSelect }: MilestoneNodeProps) {
  const salary = formatSalary(milestone);
  const proofCount = milestone.proofArtifacts?.length ?? 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`flex w-full gap-4 rounded-lg text-left transition-colors ${
        isSelected ? "bg-[var(--accent-soft)]" : "hover:bg-bg-sub-2"
      }`}
    >
      <div className="flex w-6 shrink-0 flex-col items-center pt-3">
        <StatusCircle status={milestone.status} selected={isSelected} />
        {!isLast && <div className="mt-1 min-h-16 w-px flex-1 bg-line-2" />}
      </div>
      <div className={`flex-1 pr-3 pt-3 ${isLast ? "pb-2" : "pb-5"}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-ink">{milestone.title}</div>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-mute-2">{milestone.description}</p>
          </div>
          <span className="mono shrink-0 rounded-full border border-line bg-bg-sub-2 px-2 py-1 text-2xs text-mute">
            {estimatedDate(milestone.estimatedMonthsFromNow)}
          </span>
        </div>

        {milestone.whyItMatters && (
          <p className="mt-2 border-l border-[var(--accent-line)] pl-3 text-xs leading-relaxed text-ink">
            {milestone.whyItMatters}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mono rounded-sm border border-line bg-bg-sub-2 px-1.5 py-px text-2xs text-mute">
            {milestone.status.replace("_", " ")}
          </span>
          {salary && (
            <span className="mono rounded-sm border border-line bg-bg-sub-2 px-1.5 py-px text-2xs text-mute-2">
              est. {salary}
            </span>
          )}
          {proofCount > 0 && (
            <span className="mono rounded-sm border border-line bg-bg-sub-2 px-1.5 py-px text-2xs text-mute-2">
              {proofCount} proof artifact{proofCount === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {milestone.requiredSkills.slice(0, 5).map((skill) => (
            <span key={skill} className="mono rounded-sm border border-line bg-bg-sub-2 px-1.5 py-px text-2xs text-mute">
              {skill}
            </span>
          ))}
          {milestone.requiredSkills.length > 5 && (
            <span className="mono text-2xs text-mute-3">+{milestone.requiredSkills.length - 5} more</span>
          )}
        </div>
      </div>
    </button>
  );
}
