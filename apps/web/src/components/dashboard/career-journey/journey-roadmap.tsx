import type { CareerJourney, JourneyMilestone, MilestoneStatus } from "@kursa/types";
import MilestoneNode from "./milestone-node";

interface JourneyRoadmapProps {
  journey: CareerJourney;
  selectedMilestoneOrder: number | null;
  onSelectMilestone: (order: number) => void;
  onMilestoneStatusChange?: (order: number, status: MilestoneStatus | null) => void;
  updatingMilestoneOrder?: number | null;
}

const STATUS_ACTIONS: { status: MilestoneStatus; label: string }[] = [
  { status: "in_progress", label: "in progress" },
  { status: "completed", label: "complete" },
];

function estimatedDate(monthsFromNow: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsFromNow);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatSalary(milestone: JourneyMilestone): string | null {
  if (milestone.salaryBand.max <= 0) return null;
  return `$${(milestone.salaryBand.min / 1000).toFixed(0)}k–${(milestone.salaryBand.max / 1000).toFixed(0)}k`;
}

function CurrentMilestone({
  journey,
  order,
  onStatusChange,
  updating,
}: {
  journey: CareerJourney;
  order: number | null;
  onStatusChange?: (order: number, status: MilestoneStatus | null) => void;
  updating?: boolean;
}) {
  const milestone = journey.milestones.find((m) => m.order === order) ?? journey.milestones[0] ?? null;
  if (!milestone) return null;

  const successCriteria = milestone.successCriteria ?? [];
  const proofArtifacts = milestone.proofArtifacts ?? [];
  const salary = formatSalary(milestone);

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mono text-2xs uppercase tracking-mono text-mute-2">2 · work this milestone</div>
          <h2 className="mt-2 text-lg font-medium text-ink">{milestone.title}</h2>
        </div>
        <span className="mono shrink-0 rounded-full border border-line bg-bg-sub-2 px-2 py-1 text-2xs text-mute">
          {estimatedDate(milestone.estimatedMonthsFromNow)}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-mute-2">{milestone.description}</p>

      {milestone.firstStep && (
        <div className="mt-4 rounded-lg border border-[var(--accent-line)] bg-[var(--accent-soft)] p-3">
          <div className="mono text-2xs uppercase tracking-mono text-accent">first action</div>
          <p className="mt-1 text-sm leading-relaxed text-ink">{milestone.firstStep}</p>
        </div>
      )}

      {onStatusChange && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {STATUS_ACTIONS.map(({ status, label }) => (
            <button
              key={status}
              type="button"
              disabled={updating || milestone.status === status}
              onClick={() => onStatusChange(milestone.order, status)}
              className={`mono rounded-md border px-2.5 py-1 text-2xs transition-all ${
                milestone.status === status ? "border-accent bg-accent text-white" : "border-line-2 bg-bg-sub-2 text-mute"
              } ${milestone.status === status || updating ? "cursor-default" : "cursor-pointer hover:border-accent"} ${
                updating ? "opacity-60" : "opacity-100"
              }`}
            >
              {label}
            </button>
          ))}
          {milestone.manuallySet && (
            <button
              type="button"
              disabled={updating}
              onClick={() => onStatusChange(milestone.order, null)}
              className="mono rounded-md border border-line bg-transparent px-2.5 py-1 text-2xs text-mute-3"
            >
              reset
            </button>
          )}
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <CompactList title="done when" items={successCriteria} empty="No success criteria yet." />
        <CompactList title="proof to collect" items={proofArtifacts} empty="No proof artifacts yet." />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="mono rounded-sm border border-line bg-bg-sub-2 px-1.5 py-px text-2xs text-mute">
          {milestone.status.replace("_", " ")}
        </span>
        {salary && (
          <span className="mono rounded-sm border border-line bg-bg-sub-2 px-1.5 py-px text-2xs text-mute-2">est. {salary}</span>
        )}
        {milestone.requiredSkills.slice(0, 4).map((skill) => (
          <span key={skill} className="mono rounded-sm border border-line bg-bg-sub-2 px-1.5 py-px text-2xs text-mute">
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

function CompactList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      <div className="mono mb-2 text-2xs uppercase tracking-mono text-mute-2">{title}</div>
      {items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.slice(0, 3).map((item) => (
            <li key={item} className="flex gap-2 text-xs leading-relaxed text-mute-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mono text-2xs text-mute-3">{empty}</div>
      )}
    </div>
  );
}

export default function JourneyRoadmap({
  journey,
  selectedMilestoneOrder,
  onSelectMilestone,
  onMilestoneStatusChange,
  updatingMilestoneOrder,
}: JourneyRoadmapProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <CurrentMilestone
        journey={journey}
        order={selectedMilestoneOrder}
        onStatusChange={onMilestoneStatusChange}
        updating={updatingMilestoneOrder !== null && updatingMilestoneOrder !== undefined}
      />

      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="mb-5 flex justify-between gap-4 max-md:flex-col">
          <div>
            <div className="mono text-2xs uppercase tracking-mono text-mute-2">3 · roadmap</div>
            <h2 className="mt-2 text-lg font-medium text-ink">Pick a milestone to inspect</h2>
          </div>
          <div className="mono text-2xs text-mute-3">
            {journey.projectedTimelineMonths} months · {Math.round(journey.confidenceScore * 100)}% confidence
          </div>
        </div>

        <div className="pl-1">
          {journey.milestones.map((m, i) => (
            <MilestoneNode
              key={m.order}
              milestone={m}
              isLast={i === journey.milestones.length - 1}
              isSelected={selectedMilestoneOrder === m.order}
              onSelect={() => onSelectMilestone(m.order)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
