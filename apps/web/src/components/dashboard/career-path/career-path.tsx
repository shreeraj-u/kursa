"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CareerPath } from "@kursa/types";

import PageHeader from "@/components/dashboard/page-header";
import { Button } from "@kursa/ui/components/button";
import { api } from "@/lib/api";

import PathSelector from "./path-selector";
import PathRoadmap from "./path-roadmap";
import PathDetailsPanel from "./path-details-panel";

interface CareerPathPageProps {
  paths: CareerPath[];
}

export default function CareerPathPage({ paths }: CareerPathPageProps) {
  const router = useRouter();
  const [localPaths, setLocalPaths] = useState(paths);
  const [generating, setGenerating] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justRegenerated, setJustRegenerated] = useState(false);

  useEffect(() => {
    setLocalPaths(paths);
  }, [paths]);

  const activePath = localPaths.find((p) => p.isActive);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(
    activePath?.id ?? localPaths[0]?.id ?? null,
  );
  const [selectedMilestoneOrder, setSelectedMilestoneOrder] = useState<number | null>(null);

  const selectedPath =
    localPaths.find((p) => p.id === selectedPathId) ?? localPaths[0] ?? null;

  useEffect(() => {
    if (!selectedPathId && localPaths[0]) setSelectedPathId(localPaths[0].id);
  }, [localPaths, selectedPathId]);

  useEffect(() => {
    setSelectedMilestoneOrder(selectedPath?.milestones[0]?.order ?? null);
  }, [selectedPath?.id]);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const result = await api.paths.generate();
      setLocalPaths(result.paths);
      setSelectedPathId(result.paths[0]?.id ?? null);
      setJustRegenerated(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate paths");
    } finally {
      setGenerating(false);
    }
  }

  function previewPath(id: string) {
    setSelectedPathId(id);
    setError(null);
  }

  async function activatePath(id: string) {
    setActivatingId(id);
    setError(null);
    try {
      const result = await api.paths.activate(id);
      setLocalPaths(result.paths);
      setSelectedPathId(id);
      setJustRegenerated(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to activate path");
    } finally {
      setActivatingId(null);
    }
  }

  // Empty state — first visit before any paths are generated.
  if (localPaths.length === 0 || !selectedPath) {
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
            <Button
              onClick={generate}
              disabled={generating}
              variant="outline"
              size="sm"
              className="mono text-ink border-line rounded-sm bg-surface hover:bg-bg-sub-2"
            >
              {generating ? "generating…" : "generate my career paths"}
            </Button>
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
          <Button
            onClick={generate}
            disabled={generating}
            variant="outline"
            size="sm"
            className="mono text-mute border-line rounded-sm bg-bg hover:bg-bg-sub-2"
          >
            {generating ? "regenerating…" : "regenerate paths"}
          </Button>
        </div>
        {justRegenerated && (
          <div className="mono text-2xs text-mute-2">
            paths regenerated — preview the options, then set one active when ready
          </div>
        )}
        {error && <div className="mono text-2xs text-warn">{error}</div>}
        <div className="grid grid-cols-[280px_1fr] gap-5 max-lg:flex max-lg:flex-col">
          <PathSelector
            paths={localPaths}
            selectedId={selectedPath.id}
            activeId={activePath?.id ?? null}
            onPreview={previewPath}
          />
          <div className="flex flex-col gap-4">
            <PathDetailsPanel
              path={selectedPath}
              isActive={activePath?.id === selectedPath.id}
              activating={activatingId === selectedPath.id}
              onActivate={() => activatePath(selectedPath.id)}
            />
            <PathRoadmap
              path={selectedPath}
              selectedMilestoneOrder={selectedMilestoneOrder}
              onSelectMilestone={setSelectedMilestoneOrder}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
