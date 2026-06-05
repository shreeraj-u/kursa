"use client";

import { useState, type ReactNode } from "react";

export type JourneyTab = "focus" | "roadmap" | "build" | "why";

interface JourneyTabShellProps {
  buildBadge?: number;
  focus: ReactNode;
  roadmap: ReactNode;
  build: ReactNode;
  why: ReactNode;
  defaultTab?: JourneyTab;
}

const TABS: Array<{ id: JourneyTab; label: string }> = [
  { id: "focus", label: "Focus" },
  { id: "roadmap", label: "Roadmap" },
  { id: "build", label: "Build" },
  { id: "why", label: "Why" },
];

export default function JourneyTabShell({
  buildBadge = 0,
  focus,
  roadmap,
  build,
  why,
  defaultTab = "focus",
}: JourneyTabShellProps) {
  const [tab, setTab] = useState<JourneyTab>(defaultTab);

  const panels: Record<JourneyTab, ReactNode> = { focus, roadmap, build, why };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1 rounded-lg border border-line bg-bg-sub p-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`mono relative rounded-md px-3 py-1.5 text-2xs transition-colors ${
              tab === item.id ? "bg-surface text-ink shadow-sm" : "text-mute hover:text-ink"
            }`}
          >
            {item.label}
            {item.id === "build" && buildBadge > 0 && (
              <span className="ml-1 rounded-full bg-accent px-1.5 py-px text-[10px] text-white">
                {buildBadge}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="mx-auto w-full max-w-3xl">{panels[tab]}</div>
    </div>
  );
}
