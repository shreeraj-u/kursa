"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  CareerJourney,
  CareerJourneyResponse,
  JourneyPreferences,
  JourneyActionItem,
  MilestoneStatus,
  UserProfile,
} from "@kursa/types";

import PageHeader from "@/components/dashboard/page-header";
import PageHelpButton from "@/components/dashboard/page-help-button";
import { DASHBOARD_PAGE_HELP } from "@/components/dashboard/page-help";
import { Button } from "@kursa/ui/components/button";
import { api } from "@/lib/api";

import JourneyRoadmap from "./journey-roadmap";
import JourneyActiveProjects from "./journey-active-projects";
import JourneySuggestedProjects from "./journey-suggested-projects";
import JourneyIntakeConversation from "./journey-intake-conversation";
import JourneyTabShell from "./journey-tab-shell";
import JourneyFocusView from "./journey-focus-view";
import JourneyWhyDrawer, { JourneyWhyFullPanel } from "./journey-why-drawer";
import JourneyChangePathPanel from "./journey-change-path-panel";
import JourneySetupAriaPanel from "./journey-setup-aria-panel";

interface CareerJourneyPageProps {
  data: CareerJourneyResponse;
  profile: UserProfile | null;
  materialChangeDetected?: boolean;
}

export default function CareerJourneyPage({ data, materialChangeDetected }: CareerJourneyPageProps) {
  const router = useRouter();
  const [journey, setJourney] = useState<CareerJourney | null>(data.journey);
  const [actionQueue, setActionQueue] = useState<JourneyActionItem[]>(data.actionQueue);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [welcomeSummary, setWelcomeSummary] = useState<string | null>(null);
  const [justRegenerated, setJustRegenerated] = useState(false);
  const [updatingMilestoneOrder, setUpdatingMilestoneOrder] = useState<number | null>(null);
  const [showRegenWarning, setShowRegenWarning] = useState(false);
  const [showIntake, setShowIntake] = useState(false);
  const [showSetupAria, setShowSetupAria] = useState(false);
  const [showChangePath, setShowChangePath] = useState(false);
  const [changePathFocus, setChangePathFocus] = useState<number | undefined>();
  const [showFullWhy, setShowFullWhy] = useState(false);
  const [selectedMilestoneOrder, setSelectedMilestoneOrder] = useState<number | null>(null);

  useEffect(() => {
    setJourney(data.journey);
    setActionQueue(data.actionQueue);
  }, [data]);

  useEffect(() => {
    setSelectedMilestoneOrder(journey?.milestones[0]?.order ?? null);
  }, [journey?.id]);

  async function doGenerate(
    preferences?: JourneyPreferences,
    source: "intake" | "quick" | "aria" | "regenerate" = "intake",
  ) {
    setShowRegenWarning(false);
    setGenerating(true);
    setError(null);
    try {
      const result = await api.journey.generate(preferences, source);
      setJourney(result.journey);
      setWelcomeSummary(result.welcomeSummary);
      setSelectedMilestoneOrder(result.journey.milestones[0]?.order ?? null);
      setJustRegenerated(true);
      setShowIntake(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate journey");
    } finally {
      setGenerating(false);
    }
  }

  function requestRegenerate() {
    setError(null);
    const hasManualMilestones = journey?.milestones.some((m) => m.manuallySet);
    if (hasManualMilestones) {
      setShowRegenWarning(true);
      return;
    }
    setShowIntake(true);
  }

  async function updateMilestone(order: number, status: MilestoneStatus | null) {
    if (!journey || updatingMilestoneOrder !== null) return;
    setUpdatingMilestoneOrder(order);
    try {
      const { journey: updated } = await api.journey.updateMilestone(order, status);
      setJourney(updated);
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

  function openChangePath(focusMilestoneOrder?: number) {
    setChangePathFocus(focusMilestoneOrder);
    setShowChangePath(true);
  }

  function handleAriaSetupApplied(
    result: {
      preferences: JourneyPreferences;
      journey?: CareerJourney;
      welcomeSummary?: string;
    },
    options: { generate: boolean },
  ) {
    setShowSetupAria(false);

    if (result.journey) {
      setJourney(result.journey);
      setWelcomeSummary(result.welcomeSummary ?? null);
      setSelectedMilestoneOrder(result.journey.milestones[0]?.order ?? null);
      setJustRegenerated(true);
      setShowIntake(false);
      router.refresh();
      return;
    }

    if (options.generate) {
      void doGenerate(result.preferences, "aria");
    }
  }

  if (!journey) {
    return (
      <div className="flex min-h-full flex-col">
        <PageHeader pageTitle="Career journey" />
        <div className="flex flex-1 flex-col gap-5 px-8 pb-8 pt-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tighter text-ink">Career journey</h1>
            <PageHelpButton help={DASHBOARD_PAGE_HELP.careerJourney} label="Career journey" />
          </div>
          <div className="flex flex-1 items-center justify-center">
            {showIntake ? (
              <JourneyIntakeConversation
                onGenerate={(prefs, source) => void doGenerate(prefs, source)}
                onTalkWithAria={() => setShowSetupAria(true)}
                onCancel={() => setShowIntake(false)}
                isSubmitting={generating}
                error={error}
              />
            ) : (
              <EmptyJourneyIntro
                onStart={() => setShowIntake(true)}
                onQuickGenerate={() => void doGenerate(undefined, "quick")}
                generating={generating}
                error={error}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  const strategy = journey.details?.strategySummary || journey.description;
  const buildBadge = (data.suggestedProjects ?? []).length;

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader pageTitle="Career journey" />
      <div className="flex flex-1 flex-col gap-5 px-8 pb-8 pt-6">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-medium tracking-tight text-ink">Your path: {journey.title}</h1>
                <PageHelpButton help={DASHBOARD_PAGE_HELP.careerJourney} label="Career journey" />
              </div>
              <p className="mt-1 text-sm leading-relaxed text-mute-2">{strategy}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFullWhy((v) => !v)}>
                Why?
              </Button>
              <Button variant="outline" size="sm" onClick={() => openChangePath()}>
                Change path
              </Button>
              <Button variant="outline" size="sm" onClick={requestRegenerate} disabled={generating}>
                Regenerate
              </Button>
            </div>
          </div>

          {welcomeSummary && justRegenerated && (
            <div className="mt-4 rounded-lg border border-[var(--accent-line)] bg-[var(--accent-soft)] px-4 py-3">
              <p className="text-sm text-ink">{welcomeSummary}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => openChangePath()}
              >
                Talk with Aria about this path
              </Button>
            </div>
          )}

          {materialChangeDetected && !justRegenerated && (
            <div className="mt-4 rounded-lg border border-line bg-bg-sub px-3 py-2 mono text-2xs text-mute">
              Your profile has shifted — consider changing the path or regenerating.
            </div>
          )}
          {error && <div className="mt-3 mono text-2xs text-warn">{error}</div>}
        </div>

        <JourneyTabShell
          buildBadge={buildBadge}
          focus={
            <JourneyFocusView
              journey={journey}
              actionQueue={actionQueue}
              onMilestoneStatusChange={updateMilestone}
              updatingMilestoneOrder={updatingMilestoneOrder}
            />
          }
          roadmap={
            <JourneyRoadmap
              journey={journey}
              selectedMilestoneOrder={selectedMilestoneOrder}
              onSelectMilestone={setSelectedMilestoneOrder}
              onMilestoneStatusChange={updateMilestone}
              updatingMilestoneOrder={updatingMilestoneOrder}
              showSalary
              onMilestoneFeelsOff={(order) => openChangePath(order)}
            />
          }
          build={
            <section className="grid gap-4 lg:grid-cols-2">
              <JourneyActiveProjects
                projects={data.activeProjects ?? []}
                githubConnected={data.githubConnected}
              />
              <JourneySuggestedProjects suggestions={data.suggestedProjects ?? []} />
            </section>
          }
          why={
            <div className="flex flex-col gap-4">
              <JourneyWhyDrawer journey={journey} onOpenFull={() => setShowFullWhy(true)} />
              <Button variant="outline" size="sm" className="self-start" onClick={() => openChangePath()}>
                Something doesn&apos;t fit
              </Button>
            </div>
          }
        />

        {showFullWhy && (
          <div className="mx-auto w-full max-w-3xl rounded-xl border border-line bg-surface p-5">
            <JourneyWhyFullPanel journey={journey} />
            <button
              type="button"
              onClick={() => setShowFullWhy(false)}
              className="mt-4 mono text-2xs text-mute-3 hover:text-mute"
            >
              Close full reasoning
            </button>
          </div>
        )}
      </div>

      {showIntake && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <JourneyIntakeConversation
            onGenerate={(prefs, source) => void doGenerate(prefs, source)}
            onTalkWithAria={() => setShowSetupAria(true)}
            onCancel={() => setShowIntake(false)}
            isSubmitting={generating}
            error={error}
          />
        </div>
      )}

      {showSetupAria && (
        <JourneySetupAriaPanel
          onClose={() => setShowSetupAria(false)}
          onApplied={handleAriaSetupApplied}
        />
      )}

      {showChangePath && (
        <JourneyChangePathPanel
          journey={journey}
          focusMilestoneOrder={changePathFocus}
          onClose={() => setShowChangePath(false)}
          onApplied={(updated) => {
            setJourney(updated);
            router.refresh();
          }}
        />
      )}

      {showRegenWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="mx-4 flex w-full max-w-sm flex-col gap-4 rounded-xl border border-line-2 bg-bg p-6">
            <div className="text-sm font-medium text-ink">Regenerate journey?</div>
            <p className="text-xs leading-relaxed text-mute-2">
              Regenerating will reset milestone progress. Use Change path to tune without losing progress.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowRegenWarning(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => { setShowRegenWarning(false); setShowIntake(true); }}>
                Continue to regenerate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyJourneyIntro({
  onStart,
  onQuickGenerate,
  generating,
  error,
}: {
  onStart: () => void;
  onQuickGenerate: () => void;
  generating: boolean;
  error: string | null;
}) {
  return (
    <div className="grid w-full max-w-3xl gap-6">
      <div className="rounded-2xl border border-line bg-surface p-7">
        <div className="mono text-2xs uppercase tracking-mono text-mute-2">career journey</div>
        <h2 className="mt-3 text-2xl font-medium tracking-tight text-ink">
          One path built from what Kursa already knows about you.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-mute-2">
          Confirm your direction in a short conversation, or generate immediately from your profile.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={onStart} disabled={generating}>
            Shape my journey
          </Button>
          <Button variant="outline" onClick={onQuickGenerate} disabled={generating}>
            {generating ? "Generating…" : "Generate from my profile"}
          </Button>
        </div>
        {error && <div className="mt-3 mono text-2xs text-warn">{error}</div>}
      </div>
    </div>
  );
}
