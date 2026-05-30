"use client";

import { useEffect, useRef, useState } from "react";
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

function setOnlyActivePath(paths: CareerPath[], activePathId: string) {
  return paths.map((path) => ({
    ...path,
    isActive: path.id === activePathId,
  }));
}

function reconcileActivatedPaths(paths: CareerPath[], requestedPathId: string) {
  return paths.some((path) => path.id === requestedPathId)
    ? setOnlyActivePath(paths, requestedPathId)
    : paths;
}

export default function CareerPathPage({ paths }: CareerPathPageProps) {
  const router = useRouter();
  const [localPaths, setLocalPaths] = useState(paths);
  const [generating, setGenerating] = useState(false);
  const [pendingActivePathId, setPendingActivePathId] = useState<string | null>(null);
  const [optimisticActivePathId, setOptimisticActivePathId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justRegenerated, setJustRegenerated] = useState(false);

  const activePath = localPaths.find((p) => p.isActive);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(
    activePath?.id ?? localPaths[0]?.id ?? null,
  );
  const [selectedMilestoneOrder, setSelectedMilestoneOrder] = useState<number | null>(null);

  const selectedPath =
    localPaths.find((p) => p.id === selectedPathId) ?? localPaths[0] ?? null;

  const pendingActivePathIdRef = useRef(pendingActivePathId);
  const optimisticActivePathIdRef = useRef(optimisticActivePathId);
  const selectedPathIdRef = useRef(selectedPathId);
  pendingActivePathIdRef.current = pendingActivePathId;
  optimisticActivePathIdRef.current = optimisticActivePathId;
  selectedPathIdRef.current = selectedPathId;

  useEffect(() => {
    setLocalPaths((currentPaths) => {
      const protectedPathId =
        pendingActivePathIdRef.current ?? optimisticActivePathIdRef.current;
      if (!protectedPathId) return paths;

      const protectedPathExists = paths.some((path) => path.id === protectedPathId);
      const selectedPathId = selectedPathIdRef.current;
      const selectedPathExists = selectedPathId
        ? paths.some((path) => path.id === selectedPathId)
        : true;
      const currentActivePathId = currentPaths.find((path) => path.isActive)?.id;
      const currentActivePathExists = currentActivePathId
        ? paths.some((path) => path.id === currentActivePathId)
        : true;

      if (!protectedPathExists || !selectedPathExists || !currentActivePathExists) {
        return paths;
      }

      return reconcileActivatedPaths(paths, protectedPathId);
    });
  }, [paths]);

  useEffect(() => {
    if (!optimisticActivePathId) return;

    const optimisticPath = paths.find((path) => path.id === optimisticActivePathId);
    if (!optimisticPath || optimisticPath.isActive) {
      setOptimisticActivePathId(null);
    }
  }, [paths, optimisticActivePathId]);

  useEffect(() => {
    if (localPaths.length === 0) {
      if (selectedPathId) setSelectedPathId(null);
      return;
    }

    if (!selectedPathId || !localPaths.some((path) => path.id === selectedPathId)) {
      setSelectedPathId(localPaths[0].id);
    }
  }, [localPaths, selectedPathId]);

  useEffect(() => {
    setSelectedMilestoneOrder(selectedPath?.milestones[0]?.order ?? null);
  }, [selectedPath?.id]);

  async function generate() {
    setGenerating(true);
    setPendingActivePathId(null);
    setOptimisticActivePathId(null);
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
    if (pendingActivePathId) return;

    const previousPaths = localPaths;
    setPendingActivePathId(id);
    setOptimisticActivePathId(id);
    setError(null);
    setLocalPaths(setOnlyActivePath(localPaths, id));
    setSelectedPathId(id);

    try {
      const result = await api.paths.activate(id);
      setLocalPaths(reconcileActivatedPaths(result.paths, id));
      if (!result.paths.some((path) => path.id === id)) {
        setOptimisticActivePathId(null);
      }
      setSelectedPathId(id);
      setJustRegenerated(false);
      router.refresh();
    } catch (e) {
      setLocalPaths(previousPaths);
      setOptimisticActivePathId(null);
      setError(e instanceof Error ? e.message : "Failed to activate path");
    } finally {
      setPendingActivePathId(null);
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
              disabled={generating || pendingActivePathId !== null}
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
            disabled={generating || pendingActivePathId !== null}
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
              activating={pendingActivePathId !== null}
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
