"use client";

import type { CareerPath } from "../mock-data";

interface PathSelectorProps {
  paths: CareerPath[];
  selectedId: string;
  onSelect: (id: string) => void;
}

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const colorClass =
    score >= 0.8
      ? "text-good border-good"
      : score >= 0.6
        ? "text-warn border-warn"
        : "text-mute-3 border-mute-3";
  return (
    <span className={`mono text-2xs border rounded-full px-1.5 py-px shrink-0 opacity-90 ${colorClass}`}>
      {pct}% match
    </span>
  );
}

export default function PathSelector({ paths, selectedId, onSelect }: PathSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="mono text-2xs text-mute-2 uppercase tracking-mono">
        3 paths generated
      </div>
      {paths.map((path) => {
        const isSelected = selectedId === path.id;
        return (
          <div
            key={path.id}
            onClick={() => onSelect(path.id)}
            className={`rounded-lg p-3 border cursor-pointer transition-colors ${
              isSelected
                ? "border-[var(--accent-line)] bg-[var(--accent-soft)]"
                : "border-line bg-surface hover:bg-bg-sub-2"
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="text-xs text-ink font-medium leading-snug">
                {path.title}
              </span>
              <ConfidenceBadge score={path.confidenceScore} />
            </div>
            <div className="mono text-2xs text-mute mb-1">
              ~{path.projectedTimelineMonths} months
            </div>
            <div className="text-xs text-mute-2 truncate">
              {path.description}
            </div>
          </div>
        );
      })}
    </div>
  );
}
