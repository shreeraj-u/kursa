"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CareerPath } from "@kursa/types";

import PageHeader from "@/components/dashboard/page-header";
import { api } from "@/lib/api";

import PathSelector from "./components/path-selector";
import PathRoadmap from "./components/path-roadmap";
import PathPulsePanel from "./components/path-pulse-panel";

interface CareerPathPageProps {
  paths: CareerPath[];
  materialChangeDetected?: boolean;
}

export default function CareerPathPage({ paths, materialChangeDetected }: CareerPathPageProps) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justRegenerated, setJustRegenerated] = useState(false);

  const activePath = paths.find((p) => p.isActive);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(
    activePath?.id ?? paths[0]?.id ?? null,
  );

  const selectedPath =
    paths.find((p) => p.id === selectedPathId) ?? paths[0] ?? null;

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      await api.paths.generate();
      setJustRegenerated(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate paths");
    } finally {
      setGenerating(false);
    }
  }

  function selectPath(id: string) {
    setSelectedPathId(id);
    // Persist the selection as the user's active focus. Fire-and-forget:
    // activation only affects ordering/initial selection on the next load.
    api.paths.activate(id).catch(() => {});
  }

  // Empty state — first visit before any paths are generated.
  if (paths.length === 0 || !selectedPath) {
    return (
      <div className="flex flex-col min-h-full">
        <PageHeader pageTitle="Career path" />
        <div className="px-8 pt-6 pb-8 flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4 max-w-sm text-center">
            <div className="text-sm text-ink font-medium">
              No career paths yet
            </div>
            <div className="text-xs text-mute-2">
              Generate realistic paths forward based on your profile — each with
              milestones, estimated salary, and a timeline.
            </div>
            <button
              onClick={generate}
              disabled={generating}
              className="mono text-xs text-ink border border-line rounded-sm px-3 py-1.5 bg-surface hover:bg-bg-sub-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? "generating…" : "generate my career paths"}
            </button>
            {error && <div className="mono text-2xs text-warn">{error}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader pageTitle="Career path" />
      <div className="px-8 pt-6 pb-8 flex flex-col gap-5 flex-1">
        <div className="flex items-center justify-between">
          <div className="mono text-xs text-mute">{selectedPath.title}</div>
          <button
            onClick={generate}
            disabled={generating}
            className="mono text-xs text-mute cursor-pointer border border-line rounded-sm px-2.5 py-1 bg-bg hover:bg-bg-sub-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? "regenerating…" : "regenerate paths"}
          </button>
        </div>
        {materialChangeDetected && !justRegenerated && (
          <div
            className="rounded-lg px-3 py-2 mono text-2xs"
            style={{ border: "1px solid var(--line)", background: "var(--bg-sub)", color: "var(--mute)" }}
          >
            Your profile has shifted since these paths were generated — consider regenerating.
          </div>
        )}
        {justRegenerated && (
          <div className="mono text-2xs text-mute-2">
            paths regenerated — pick the one you want to focus on
          </div>
        )}
        {error && <div className="mono text-2xs text-warn">{error}</div>}
        <div className="grid grid-cols-[280px_1fr] gap-5 max-lg:flex max-lg:flex-col">
          <PathSelector
            paths={paths}
            selectedId={selectedPath.id}
            onSelect={selectPath}
          />
          <PathRoadmap path={selectedPath} />
        </div>
        <PathPulsePanel />
      </div>
    </div>
  );
}
