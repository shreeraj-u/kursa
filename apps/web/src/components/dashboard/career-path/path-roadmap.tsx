import type { CareerPath, MilestoneStatus } from "@kursa/types";
import MilestoneNode from "./milestone-node";

interface PathRoadmapProps {
  path: CareerPath;
  selectedMilestoneOrder: number | null;
  onSelectMilestone: (order: number) => void;
  onMilestoneStatusChange?: (order: number, status: MilestoneStatus | null) => void;
  updatingMilestoneOrder?: number | null;
}

function YouAreHereNode() {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex flex-col items-center w-5 shrink-0">
        <div className="w-3.5 h-3.5 rounded-full bg-ink shrink-0" />
        <div className="w-px flex-1 min-h-5 bg-line-2 mt-0.5" />
      </div>
      <div className="pb-4">
        <span className="mono text-2xs text-mute">you are here</span>
      </div>
    </div>
  );
}

function TargetNode({ title }: { title: string }) {
  return (
    <div className="flex gap-4 items-center">
      <div className="w-5 flex justify-center shrink-0">
        <div className="w-3 h-3 bg-accent rotate-45 shrink-0" />
      </div>
      <span className="text-xs text-accent font-medium">{title}</span>
    </div>
  );
}

const STATUS_ACTIONS: { status: MilestoneStatus; label: string }[] = [
  { status: "in_progress", label: "in progress" },
  { status: "completed", label: "complete" },
];

function MilestoneInspector({
  path,
  order,
  onStatusChange,
  updating,
}: {
  path: CareerPath;
  order: number | null;
  onStatusChange?: (order: number, status: MilestoneStatus | null) => void;
  updating?: boolean;
}) {
  const milestone =
    path.milestones.find((m) => m.order === order) ??
    path.milestones[0] ??
    null;
  if (!milestone) return null;

  return (
    <div className="rounded-lg p-4 border border-line bg-surface">
      <div className="mono text-2xs text-mute-2 uppercase tracking-mono mb-3">
        milestone detail
      </div>
      <div className="text-sm text-ink font-medium mb-1">{milestone.title}</div>
      <div className="text-xs text-mute-2 mb-3">{milestone.description}</div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-md border border-line bg-bg-sub-2 p-2">
          <div className="mono text-2xs text-mute-3">status</div>
          <div className="mono text-2xs text-ink flex items-center gap-1">
            {milestone.status.replace("_", " ")}
            {milestone.manuallySet && (
              <span className="mono text-2xs text-mute-3">· you</span>
            )}
          </div>
        </div>
        <div className="rounded-md border border-line bg-bg-sub-2 p-2">
          <div className="mono text-2xs text-mute-3">target date</div>
          <div className="mono text-2xs text-ink">
            {estimatedDate(milestone.estimatedMonthsFromNow)}
          </div>
        </div>
      </div>

      {onStatusChange && (
        <div className="flex items-center gap-1.5 mb-3">
          {STATUS_ACTIONS.map(({ status, label }) => (
            <button
              key={status}
              type="button"
              disabled={updating || milestone.status === status}
              onClick={() => onStatusChange(milestone.order, status)}
              className={`mono text-2xs py-[3px] px-2.5 rounded-[5px] border border-line-2 transition-all ${
                milestone.status === status
                  ? "bg-accent text-white"
                  : "bg-bg-sub-2 text-mute"
              } ${
                milestone.status === status || updating
                  ? "cursor-default"
                  : "cursor-pointer"
              } ${updating ? "opacity-60" : "opacity-100"}`}
            >
              {label}
            </button>
          ))}
          {milestone.manuallySet && (
            <button
              type="button"
              disabled={updating}
              onClick={() => onStatusChange(milestone.order, null)}
              className={`mono text-2xs py-[3px] px-2.5 rounded-[5px] border border-line bg-transparent text-mute-3 transition-opacity ${
                updating ? "cursor-default opacity-60" : "cursor-pointer opacity-100"
              }`}
            >
              reset
            </button>
          )}
        </div>
      )}

      {milestone.salaryBand.max > 0 && (
        <div className="mono text-2xs text-mute-2 mb-3">
          salary estimate · ${(milestone.salaryBand.min / 1000).toFixed(0)}k–
          ${(milestone.salaryBand.max / 1000).toFixed(0)}k {milestone.salaryBand.currency}
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {milestone.requiredSkills.length > 0 ? (
          milestone.requiredSkills.map((skill) => (
            <span
              key={skill}
              className="mono text-2xs text-mute border border-line rounded-sm px-1.5 py-px bg-bg-sub-2"
            >
              {skill}
            </span>
          ))
        ) : (
          <span className="mono text-2xs text-mute-3">no explicit required skills</span>
        )}
      </div>
    </div>
  );
}

function estimatedDate(monthsFromNow: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsFromNow);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function PathRoadmap({
  path,
  selectedMilestoneOrder,
  onSelectMilestone,
  onMilestoneStatusChange,
  updatingMilestoneOrder,
}: PathRoadmapProps) {
  return (
    <div className="grid grid-cols-[1fr_280px] gap-4 max-xl:grid-cols-1">
      <div className="rounded-lg p-4 border border-line bg-surface">
        <div className="flex justify-between items-center mb-6">
          <div className="mono text-2xs text-mute-2 uppercase tracking-mono">
            career path · {path.title}
          </div>
          <div className="mono text-2xs text-mute-3">
            {path.projectedTimelineMonths} months ·{" "}
            {Math.round(path.confidenceScore * 100)}% confidence
          </div>
        </div>

        <div className="pl-1">
          <YouAreHereNode />
          {path.milestones.map((m, i) => (
            <MilestoneNode
              key={m.order}
              milestone={m}
              isLast={i === path.milestones.length - 1}
              isSelected={selectedMilestoneOrder === m.order}
              onSelect={() => onSelectMilestone(m.order)}
            />
          ))}
          <TargetNode title={path.title} />
        </div>
      </div>
      <MilestoneInspector
        path={path}
        order={selectedMilestoneOrder}
        onStatusChange={onMilestoneStatusChange}
        updating={updatingMilestoneOrder !== null && updatingMilestoneOrder !== undefined}
      />
    </div>
  );
}
