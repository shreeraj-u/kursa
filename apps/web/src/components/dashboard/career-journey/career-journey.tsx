"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  CareerJourney,
  CareerJourneyResponse,
  JourneyActionItem,
  MilestoneStatus,
} from "@kursa/types";

import PageHeader from "@/components/dashboard/page-header";
import { Button } from "@kursa/ui/components/button";
import { api } from "@/lib/api";

import JourneyRoadmap from "./journey-roadmap";
import JourneyDetailsPanel from "./journey-details-panel";
import JourneyPulsePanel from "./journey-pulse-panel";
import JourneyActionQueue from "./journey-action-queue";

interface CareerJourneyPageProps {
  data: CareerJourneyResponse;
  materialChangeDetected?: boolean;
}

export default function CareerJourneyPage({ data, materialChangeDetected }: CareerJourneyPageProps) {
  const router = useRouter();
  const [journey, setJourney] = useState<CareerJourney | null>(data.journey);
  const [actionQueue, setActionQueue] = useState<JourneyActionItem[]>(data.actionQueue);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justRegenerated, setJustRegenerated] = useState(false);
  const [updatingMilestoneOrder, setUpdatingMilestoneOrder] = useState<number | null>(null);
  const [showRegenWarning, setShowRegenWarning] = useState(false);
  const [selectedMilestoneOrder, setSelectedMilestoneOrder] = useState<number | null>(null);

  useEffect(() => {
    setJourney(data.journey);
    setActionQueue(data.actionQueue);
  }, [data]);

  useEffect(() => {
    setSelectedMilestoneOrder(journey?.milestones[0]?.order ?? null);
  }, [journey?.id]);

  function requestGenerate() {
    const hasManualMilestones = journey?.milestones.some((m) => m.manuallySet);
    if (hasManualMilestones) {
      setShowRegenWarning(true);
    } else {
      void doGenerate();
    }
  }

  async function doGenerate() {
    setShowRegenWarning(false);
    setGenerating(true);
    setError(null);
    try {
      const result = await api.journey.generate();
      setJourney(result.journey);
      setSelectedMilestoneOrder(result.journey.milestones[0]?.order ?? null);
      setJustRegenerated(true);
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
        <div className="px-8 pt-6 pb-8 flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4 max-w-sm text-center">
            <div className="text-sm text-ink font-medium">
              No career journey yet
            </div>
            <div className="text-xs text-mute-2">
              Generate a single best-fit journey based on your profile — with
              milestones, estimated salary, and a timeline that extends as you progress.
            </div>
            <Button
              onClick={requestGenerate}
              disabled={generating}
              variant="outline"
              size="sm"
              className="mono text-ink border-line rounded-sm bg-surface hover:bg-bg-sub-2"
            >
              {generating ? "generating…" : "generate my career journey"}
            </Button>
            {error && <div className="mono text-2xs text-warn">{error}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader pageTitle="Career journey" />
      <div className="px-8 pt-6 pb-8 flex flex-col gap-5 flex-1">
        <div className="flex items-center justify-between">
          <div className="mono text-xs text-mute">{journey.title}</div>
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
        <div className="grid grid-cols-[1fr_320px] gap-5 max-lg:grid-cols-1">
          <div className="flex flex-col gap-4">
            <JourneyDetailsPanel journey={journey} />
            <JourneyRoadmap
              journey={journey}
              selectedMilestoneOrder={selectedMilestoneOrder}
              onSelectMilestone={setSelectedMilestoneOrder}
              onMilestoneStatusChange={updateMilestone}
              updatingMilestoneOrder={updatingMilestoneOrder}
            />
          </div>
          <JourneyActionQueue actionQueue={actionQueue} />
        </div>
        <JourneyPulsePanel />
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
                onClick={() => void doGenerate()}
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
