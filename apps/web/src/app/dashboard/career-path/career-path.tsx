"use client";

import { useState } from "react";
import PageHeader from "@/components/dashboard/page-header";
import PathSelector from "./components/path-selector";
import PathRoadmap from "./components/path-roadmap";
import type { CareerPath } from "./mock-data";

interface CareerPathPageProps {
  paths: CareerPath[];
}

export default function CareerPathPage({ paths }: CareerPathPageProps) {
  const [selectedPathId, setSelectedPathId] = useState<string>(paths[0].id);
  const selectedPath = paths.find((p) => p.id === selectedPathId) ?? paths[0];

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader pageTitle="Career path" />
      <div className="px-8 pt-6 pb-8 flex flex-col gap-5 flex-1">
        <div className="flex items-center justify-between">
          <div className="mono text-xs text-mute">{selectedPath.title}</div>
          <button
            disabled
            className="mono text-xs text-mute-3 cursor-not-allowed border border-line rounded-sm px-2.5 py-1 bg-bg"
          >
            regenerate paths
          </button>
        </div>
        <div className="grid grid-cols-[280px_1fr] gap-5 max-lg:flex max-lg:flex-col">
          <PathSelector
            paths={paths}
            selectedId={selectedPathId}
            onSelect={setSelectedPathId}
          />
          <PathRoadmap path={selectedPath} />
        </div>
      </div>
    </div>
  );
}
