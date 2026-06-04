"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import type {
  CareerJourney,
  CareerJourneyResponse,
  JourneyGrowthPace,
  JourneyPreferences,
  JourneyPriority,
  JourneyActionItem,
  MilestoneStatus,
} from "@kursa/types";

import PageHeader from "@/components/dashboard/page-header";
import PageHelpButton from "@/components/dashboard/page-help-button";
import { DASHBOARD_PAGE_HELP } from "@/components/dashboard/page-help";
import { Button } from "@kursa/ui/components/button";
import { api } from "@/lib/api";

import JourneyRoadmap from "./journey-roadmap";
import JourneyDetailsPanel from "./journey-details-panel";
import JourneyActionQueue from "./journey-action-queue";

interface CareerJourneyPageProps {
  data: CareerJourneyResponse;
  materialChangeDetected?: boolean;
}

const EMPTY_PREFERENCES: JourneyPreferences = {
  preferredDirection: "",
  leanToward: "",
  avoid: "",
  growthPace: "",
  priorities: [],
  hardConstraints: "",
  notes: "",
};

const GROWTH_PACES: Array<{ value: JourneyGrowthPace; label: string; description: string }> = [
  { value: "steady", label: "Steady", description: "Realistic progress with manageable risk." },
  { value: "accelerated", label: "Accelerated", description: "Stretch faster toward a bigger move." },
  { value: "exploratory", label: "Exploratory", description: "Keep room for pivots and discovery." },
];

const PRIORITIES: Array<{ value: JourneyPriority; label: string }> = [
  { value: "salary", label: "Salary" },
  { value: "stability", label: "Stability" },
  { value: "leadership", label: "Leadership" },
  { value: "autonomy", label: "Autonomy" },
  { value: "learning", label: "Learning" },
  { value: "location", label: "Location" },
  { value: "remote", label: "Remote" },
  { value: "impact", label: "Impact" },
];

export default function CareerJourneyPage({ data, materialChangeDetected }: CareerJourneyPageProps) {
  const router = useRouter();
  const [journey, setJourney] = useState<CareerJourney | null>(data.journey);
  const [actionQueue, setActionQueue] = useState<JourneyActionItem[]>(data.actionQueue);
  const [setupPreferences, setSetupPreferences] = useState<JourneyPreferences>(
    data.journeyPreferences ?? EMPTY_PREFERENCES,
  );
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justRegenerated, setJustRegenerated] = useState(false);
  const [updatingMilestoneOrder, setUpdatingMilestoneOrder] = useState<number | null>(null);
  const [showRegenWarning, setShowRegenWarning] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [pendingGeneratePreferences, setPendingGeneratePreferences] = useState<JourneyPreferences | null>(null);
  const [selectedMilestoneOrder, setSelectedMilestoneOrder] = useState<number | null>(null);

  useEffect(() => {
    setJourney(data.journey);
    setActionQueue(data.actionQueue);
    setSetupPreferences(data.journeyPreferences ?? EMPTY_PREFERENCES);
  }, [data]);

  useEffect(() => {
    setSelectedMilestoneOrder(journey?.milestones[0]?.order ?? null);
  }, [journey?.id]);

  function requestGenerate() {
    setError(null);
    setShowSetup(true);
  }

  function submitSetup() {
    const hasManualMilestones = journey?.milestones.some((m) => m.manuallySet);
    if (hasManualMilestones) {
      setPendingGeneratePreferences(setupPreferences);
      setShowRegenWarning(true);
      return;
    }
    void doGenerate(setupPreferences);
  }

  async function doGenerate(preferences?: JourneyPreferences) {
    setShowRegenWarning(false);
    setGenerating(true);
    setError(null);
    try {
      const result = await api.journey.generate(preferences);
      setJourney(result.journey);
      setSelectedMilestoneOrder(result.journey.milestones[0]?.order ?? null);
      setJustRegenerated(true);
      setShowSetup(false);
      setPendingGeneratePreferences(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate journey");
    } finally {
      setGenerating(false);
    }
  }

  async function updateMilestone(order: number, status: MilestoneStatus | null) {
    if (!journey || updatingMilestoneOrder !== null) return;
    setUpdatingMilestoneOrder(order);
    try {
      const { journey: updated } = await api.journey.updateMilestone(order, status);
      setJourney(updated);
      // Refresh the action queue (and any auto-extension) from the server.
      const refreshed = await api.journey.get();
      if (refreshed.journey) setJourney(refreshed.journey);
      setActionQueue(refreshed.actionQueue);
      router.refresh();
    } catch {
      setError("Failed to update milestone");
    } finally {
      setUpdatingMilestoneOrder(null);
    }
  }

  // Empty state — first visit before a journey is generated.
  if (!journey) {
    return (
      <div className="flex flex-col min-h-full">
        <PageHeader pageTitle="Career journey" />
        <div className="px-8 pt-6 pb-8 flex flex-1 flex-col gap-5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tighter text-ink">Career journey</h1>
            <PageHelpButton help={DASHBOARD_PAGE_HELP.careerJourney} label="Career journey" />
          </div>
          <div className="flex flex-1 items-center justify-center">
          {showSetup ? (
            <JourneySetupForm
              preferences={setupPreferences}
              onChange={setSetupPreferences}
              onSubmit={submitSetup}
              onCancel={() => setShowSetup(false)}
              isSubmitting={generating}
              error={error}
            />
          ) : (
            <EmptyJourneyIntro onGenerate={requestGenerate} generating={generating} error={error} />
          )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader pageTitle="Career journey" />
      <div className="px-8 pt-6 pb-8 flex flex-col gap-5 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tighter text-ink">Career journey</h1>
              <PageHelpButton help={DASHBOARD_PAGE_HELP.careerJourney} label="Career journey" />
            </div>
            <div className="mono mt-1 text-xs text-mute">active journey · {journey.title}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowSetup((value) => !value)}
              disabled={generating}
              variant="outline"
              size="sm"
              className="mono text-mute border-line rounded-sm bg-bg hover:bg-bg-sub-2"
            >
              {showSetup ? "hide preferences" : "edit preferences"}
            </Button>
            <Button
              onClick={requestGenerate}
              disabled={generating}
              variant="outline"
              size="sm"
              className="mono text-mute border-line rounded-sm bg-bg hover:bg-bg-sub-2"
            >
              {generating ? "regenerating…" : "regenerate journey"}
            </Button>
          </div>
        </div>
        {showSetup && (
          <JourneySetupForm
            preferences={setupPreferences}
            onChange={setSetupPreferences}
            onSubmit={submitSetup}
            onCancel={() => setShowSetup(false)}
            isSubmitting={generating}
            error={error}
            compact
          />
        )}
        {materialChangeDetected && !justRegenerated && (
          <div
            className="rounded-lg px-3 py-2 mono text-2xs"
            style={{ border: "1px solid var(--line)", background: "var(--bg-sub)", color: "var(--mute)" }}
          >
            Your profile has shifted since this journey was generated — consider regenerating.
          </div>
        )}
        {justRegenerated && (
          <div className="mono text-2xs text-mute-2">
            journey regenerated — your timeline and milestones are fresh
          </div>
        )}
        {error && <div className="mono text-2xs text-warn">{error}</div>}

        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
          <JourneyHero journey={journey} />
          <JourneyUseStrip />

          <section className="grid grid-cols-[minmax(0,1fr)_300px] gap-4 max-lg:grid-cols-1">
            <JourneyRoadmap
              journey={journey}
              selectedMilestoneOrder={selectedMilestoneOrder}
              onSelectMilestone={setSelectedMilestoneOrder}
              onMilestoneStatusChange={updateMilestone}
              updatingMilestoneOrder={updatingMilestoneOrder}
            />
            <JourneyActionQueue actionQueue={actionQueue} />
          </section>

          <details className="group rounded-xl border border-line bg-surface">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 select-none">
              <div>
                <div className="mono text-2xs uppercase tracking-mono text-mute-2">advisor reasoning</div>
                <div className="mt-1 text-sm font-medium text-ink">Open if you want the why, risks, and evidence</div>
              </div>
              <span className="mono text-2xs text-mute-3 group-open:hidden">show</span>
              <span className="mono hidden text-2xs text-mute-3 group-open:inline">hide</span>
            </summary>
            <div className="border-t border-line p-4">
              <JourneyDetailsPanel journey={journey} />
            </div>
          </details>
        </div>
      </div>

      {showRegenWarning && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <div
            className="rounded-xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4"
            style={{ background: "var(--bg)", border: "1px solid var(--line-2)" }}
          >
            <div className="text-sm font-medium" style={{ color: "var(--ink)" }}>
              Regenerate journey?
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--mute-2)" }}>
              Regenerating will reset your milestone progress — manually set statuses will be lost.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRegenWarning(false)}
                className="mono"
                style={{
                  fontSize: 11,
                  padding: "5px 14px",
                  borderRadius: 6,
                  border: "1px solid var(--line-2)",
                  background: "transparent",
                  color: "var(--mute)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void doGenerate(pendingGeneratePreferences ?? undefined)}
                className="mono"
                style={{
                  fontSize: 11,
                  padding: "5px 14px",
                  borderRadius: 6,
                  border: "none",
                  background: "var(--accent)",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function JourneyUseStrip() {
  const actions = [
    { href: "/dashboard/skills", label: "Skills", copy: "prioritize these gaps" },
    { href: "/dashboard/resume", label: "Resume Studio", copy: "tailor résumé to this path" },
    { href: "/dashboard/journal", label: "Journal", copy: "log milestone evidence" },
  ];

  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <div className="mb-2 mono text-2xs uppercase tracking-mono text-mute-2">use this journey</div>
      <div className="grid gap-2 md:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href as Route}
            className="rounded-lg border border-line bg-bg-sub px-3 py-2 transition-colors hover:border-line-2 hover:bg-bg-sub-2"
          >
            <div className="text-xs font-medium text-ink">{action.label}</div>
            <div className="mt-0.5 text-[11px] text-mute">{action.copy} →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function EmptyJourneyIntro({
  onGenerate,
  generating,
  error,
}: {
  onGenerate: () => void;
  generating: boolean;
  error: string | null;
}) {
  return (
    <div className="grid w-full max-w-5xl grid-cols-[1.1fr_0.9fr] gap-6 max-lg:grid-cols-1">
      <div className="rounded-2xl border border-line bg-surface p-7">
        <div className="mono text-2xs uppercase tracking-mono text-mute-2">career journey</div>
        <h1 className="mt-3 max-w-2xl text-3xl font-medium tracking-[-0.04em] text-ink">
          Turn your profile into one path you can actually follow.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-mute-2">
          Kursa reads your profile evidence, preferences, skills, and recent signals, then commits to a single best-fit
          journey. You get the strategy, milestones, risks, proof artifacts, and next actions in one place.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            onClick={onGenerate}
            disabled={generating}
            variant="outline"
            size="sm"
            className="mono text-ink border-line rounded-sm bg-bg hover:bg-bg-sub-2"
          >
            {generating ? "generating…" : "shape and generate journey"}
          </Button>
          {error && <div className="mono self-center text-2xs text-warn">{error}</div>}
        </div>
      </div>
      <div className="grid gap-3">
        {[
          ["strategy", "Why this route fits your current evidence and what assumptions Kursa is making."],
          ["milestones", "The sequence of role, scope, skill, and proof points that move you forward."],
          ["next move", "A live queue of journey, skill, and application actions ranked by urgency."],
          ["risks", "Tradeoffs and blockers surfaced early so the plan is easier to trust."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-xl border border-line bg-bg-sub p-4">
            <div className="mono text-2xs uppercase tracking-mono text-accent">{title}</div>
            <p className="mt-2 text-xs leading-relaxed text-mute-2">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function JourneyHero({ journey }: { journey: CareerJourney }) {
  const details = journey.details;
  const strategy = details?.strategySummary || journey.description;
  const completed = journey.milestones.filter((m) => m.status === "completed").length;
  const current =
    journey.milestones.find((m) => m.status === "in_progress") ??
    journey.milestones.find((m) => m.status !== "completed") ??
    journey.milestones[0];

  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <div className="mono text-2xs uppercase tracking-mono text-mute-2">1 · start here</div>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_220px] gap-5 max-lg:grid-cols-1">
        <div>
          <h1 className="text-2xl font-medium tracking-[-0.035em] text-ink">{journey.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-mute-2">{strategy}</p>
          {current && (
            <div className="mt-5 rounded-xl border border-[var(--accent-line)] bg-[var(--accent-soft)] p-4">
              <div className="mono text-2xs uppercase tracking-mono text-accent">your next focus</div>
              <div className="mt-1 text-base font-medium text-ink">{current.title}</div>
              <p className="mt-1 text-sm leading-relaxed text-mute-2">{current.firstStep || current.description}</p>
            </div>
          )}
        </div>
        <div className="grid content-start gap-2">
          <HeroMetric label="progress" value={`${completed}/${journey.milestones.length}`} />
          <HeroMetric label="timeline" value={`${journey.projectedTimelineMonths}mo`} />
          <HeroMetric label="confidence" value={`${Math.round(journey.confidenceScore * 100)}%`} />
        </div>
      </div>
    </section>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-bg-sub-2 px-3 py-2">
      <div className="mono text-2xs text-mute-3">{label}</div>
      <div className="mt-1 text-sm font-medium text-ink">{value}</div>
    </div>
  );
}

function JourneySetupForm({
  preferences,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
  compact = false,
}: {
  preferences: JourneyPreferences;
  onChange: (preferences: JourneyPreferences) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error: string | null;
  compact?: boolean;
}) {
  const update = <Key extends keyof JourneyPreferences>(key: Key, value: JourneyPreferences[Key]) => {
    onChange({ ...preferences, [key]: value });
  };

  const togglePriority = (priority: JourneyPriority) => {
    const hasPriority = preferences.priorities.includes(priority);
    if (hasPriority) {
      update("priorities", preferences.priorities.filter((item) => item !== priority));
      return;
    }
    if (preferences.priorities.length >= 5) return;
    update("priorities", [...preferences.priorities, priority]);
  };

  return (
    <div className={`w-full ${compact ? "" : "max-w-2xl"} rounded-2xl border border-line bg-surface p-5`}>
      <div className="mb-4">
        <div className="mono text-2xs text-mute-2 uppercase tracking-mono">career journey setup</div>
        <h2 className="mt-2 text-sm font-medium text-ink">Customize your path before Kursa generates it</h2>
        <p className="mt-1 text-xs leading-relaxed text-mute-2">
          Everything here is optional. Kursa will use these answers to shape one realistic path from your profile evidence.
        </p>
      </div>

      <div className="grid gap-3">
        <PreferenceTextarea
          label="Preferred direction"
          placeholder="e.g. Staff AI Engineer, founder path, product-minded engineering leadership"
          value={preferences.preferredDirection}
          onChange={(value) => update("preferredDirection", value)}
        />
        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
          <PreferenceTextarea
            label="Lean toward"
            placeholder="Roles, industries, company stages, or kinds of work you want more of"
            value={preferences.leanToward}
            onChange={(value) => update("leanToward", value)}
          />
          <PreferenceTextarea
            label="Avoid"
            placeholder="Paths, industries, responsibilities, or tradeoffs you do not want"
            value={preferences.avoid}
            onChange={(value) => update("avoid", value)}
          />
        </div>

        <div>
          <div className="mb-2 mono text-2xs text-mute-2 uppercase tracking-mono">growth pace</div>
          <div className="grid grid-cols-3 gap-2 max-md:grid-cols-1">
            {GROWTH_PACES.map((pace) => (
              <button
                key={pace.value}
                type="button"
                onClick={() => update("growthPace", preferences.growthPace === pace.value ? "" : pace.value)}
                className="rounded-lg border px-3 py-2 text-left"
                style={{
                  borderColor: preferences.growthPace === pace.value ? "var(--accent)" : "var(--line)",
                  background: preferences.growthPace === pace.value ? "var(--bg-sub)" : "transparent",
                }}
              >
                <div className="text-xs font-medium text-ink">{pace.label}</div>
                <div className="mt-1 text-2xs text-mute-2">{pace.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="mono text-2xs text-mute-2 uppercase tracking-mono">priorities</div>
            <div className="mono text-2xs text-mute-3">{preferences.priorities.length}/5</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((priority) => {
              const active = preferences.priorities.includes(priority.value);
              return (
                <button
                  key={priority.value}
                  type="button"
                  onClick={() => togglePriority(priority.value)}
                  className="rounded-full border px-3 py-1 mono text-2xs"
                  style={{
                    borderColor: active ? "var(--accent)" : "var(--line)",
                    background: active ? "var(--bg-sub)" : "transparent",
                    color: active ? "var(--ink)" : "var(--mute)",
                  }}
                >
                  {priority.label}
                </button>
              );
            })}
          </div>
        </div>

        <PreferenceTextarea
          label="Hard constraints"
          placeholder="e.g. remote only, no relocation, visa constraints, family schedule, minimum compensation"
          value={preferences.hardConstraints}
          onChange={(value) => update("hardConstraints", value)}
        />
        <PreferenceTextarea
          label="Anything else"
          placeholder="Extra context you want Kursa to consider when choosing the best path"
          value={preferences.notes}
          onChange={(value) => update("notes", value)}
        />
      </div>

      {error && <div className="mt-3 mono text-2xs text-warn">{error}</div>}

      <div className="mt-5 flex justify-end gap-2">
        <Button
          onClick={onCancel}
          disabled={isSubmitting}
          variant="outline"
          size="sm"
          className="mono text-mute border-line rounded-sm bg-bg hover:bg-bg-sub-2"
        >
          cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          variant="outline"
          size="sm"
          className="mono text-ink border-line rounded-sm bg-surface hover:bg-bg-sub-2"
        >
          {isSubmitting ? "generating…" : "generate customized journey"}
        </Button>
      </div>
    </div>
  );
}

function PreferenceTextarea({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block mono text-2xs text-mute-2 uppercase tracking-mono">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-xs text-ink outline-none placeholder:text-mute-3 focus:border-line-2"
      />
    </label>
  );
}
