import Link from "next/link";
import type { Route } from "next";
import type { CareerJourney, JourneyActionItem, MilestoneStatus } from "@kursa/types";
import { Button } from "@kursa/ui/components/button";

interface JourneyFocusViewProps {
  journey: CareerJourney;
  actionQueue: JourneyActionItem[];
  onMilestoneStatusChange?: (order: number, status: MilestoneStatus | null) => void;
  updatingMilestoneOrder?: number | null;
}

function currentMilestone(journey: CareerJourney) {
  return (
    journey.milestones.find((m) => m.status === "in_progress") ??
    journey.milestones.find((m) => m.status !== "completed") ??
    journey.milestones[0] ??
    null
  );
}

function upcomingMilestones(journey: CareerJourney, currentOrder: number | null) {
  return journey.milestones
    .filter((m) => m.order !== currentOrder && m.status !== "completed")
    .slice(0, 2);
}

export default function JourneyFocusView({
  journey,
  actionQueue,
  onMilestoneStatusChange,
  updatingMilestoneOrder,
}: JourneyFocusViewProps) {
  const current = currentMilestone(journey);
  const upcoming = upcomingMilestones(journey, current?.order ?? null);
  const todayActions = actionQueue.slice(0, 3);

  return (
    <div className="flex flex-col gap-5">
      {current && (
        <section className="rounded-xl border border-line bg-surface p-5">
          <div className="mono text-2xs uppercase tracking-mono text-accent">Now</div>
          <h2 className="mt-2 text-lg font-medium text-ink">{current.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-mute-2">
            {current.firstStep || current.description}
          </p>
          {onMilestoneStatusChange && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={updatingMilestoneOrder != null || current.status === "in_progress"}
                onClick={() => onMilestoneStatusChange(current.order, "in_progress")}
              >
                Mark in progress
              </Button>
              <Link
                href={"/dashboard/journal" as Route}
                className="mono inline-flex items-center rounded-md border border-line bg-bg-sub-2 px-3 py-1.5 text-2xs text-mute hover:border-accent"
              >
                Log evidence →
              </Link>
            </div>
          )}
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="rounded-xl border border-line bg-bg-sub p-4">
          <div className="mono text-2xs uppercase tracking-mono text-mute-2">Next</div>
          <ul className="mt-2 space-y-2">
            {upcoming.map((m) => (
              <li key={m.order} className="text-sm text-mute-2">
                <span className="text-ink">{m.title}</span>
                <span className="mono ml-2 text-2xs text-mute-3">~{m.estimatedMonthsFromNow}mo</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {todayActions.length > 0 && (
        <section className="rounded-xl border border-line bg-surface p-5">
          <div className="mono text-2xs uppercase tracking-mono text-mute-2">Do today</div>
          <ul className="mt-3 space-y-3">
            {todayActions.map((action, i) => (
              <li key={`${action.title}-${i}`}>
                <Link href={action.linkTo as Route} className="block rounded-lg border border-line bg-bg-sub px-3 py-2 hover:border-line-2">
                  <div className="text-sm font-medium text-ink">{action.title}</div>
                  <div className="mt-0.5 text-xs text-mute-2">{action.subtitle}</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
