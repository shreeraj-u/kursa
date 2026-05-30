import { Check } from "lucide-react";
import type { Milestone } from "@kursa/types";

interface MilestoneNodeProps {
  milestone: Milestone;
  isLast: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

function estimatedDate(monthsFromNow: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsFromNow);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function StatusCircle({ status }: { status: Milestone["status"] }) {
  if (status === "completed") {
    return (
      <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center shrink-0">
        <Check size={9} className="text-white" />
      </div>
    );
  }
  if (status === "in_progress") {
    return (
      <div className="w-4 h-4 rounded-full border-2 border-accent bg-[var(--accent-soft)] flex items-center justify-center shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
      </div>
    );
  }
  return <div className="w-4 h-4 rounded-full border-2 border-line-2 shrink-0" />;
}

export default function MilestoneNode({ milestone, isLast, isSelected, onSelect }: MilestoneNodeProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`flex w-full gap-4 items-start rounded-md text-left transition-colors ${
        isSelected ? "bg-[var(--accent-soft)]" : "hover:bg-bg-sub-2"
      }`}
    >
      <div className="flex flex-col items-center w-5 shrink-0">
        <StatusCircle status={milestone.status} />
        {!isLast && <div className="w-px flex-1 min-h-8 bg-line-2 mt-0.5" />}
      </div>
      <div className={`flex-1 ${isLast ? "pb-0" : "pb-5"}`}>
        <div className="text-xs text-ink font-medium mb-0.5">{milestone.title}</div>
        <div className="text-xs text-mute-2 mb-1">{milestone.description}</div>
        <div className="flex items-center gap-3 mb-1.5">
          <span className="mono text-2xs text-mute">
            {estimatedDate(milestone.estimatedMonthsFromNow)}
          </span>
          {milestone.salaryBand.max > 0 && (
            <span className="mono text-2xs text-mute-2">
              est. ${(milestone.salaryBand.min / 1000).toFixed(0)}k –{" "}
              ${(milestone.salaryBand.max / 1000).toFixed(0)}k
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {milestone.requiredSkills.map((skill) => (
            <span
              key={skill}
              className="mono text-2xs text-mute border border-line rounded-sm px-1.5 py-px bg-bg-sub-2"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
