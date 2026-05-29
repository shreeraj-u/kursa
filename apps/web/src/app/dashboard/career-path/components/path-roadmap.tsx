import type { CareerPath } from "../mock-data";
import MilestoneNode from "./milestone-node";

interface PathRoadmapProps {
  path: CareerPath;
}

function YouAreHereNode() {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex flex-col items-center w-5 shrink-0">
        <div className="w-3.5 h-3.5 rounded-full bg-ink shrink-0" />
        <div className="w-px flex-1 min-h-5 bg-line-2 mt-0.5" />
      </div>
      <div className="pb-4">
        <span className="mono text-2xs text-mute">you are here</span>
      </div>
    </div>
  );
}

function TargetNode({ title }: { title: string }) {
  return (
    <div className="flex gap-4 items-center">
      <div className="w-5 flex justify-center shrink-0">
        <div className="w-3 h-3 bg-accent rotate-45 shrink-0" />
      </div>
      <span className="text-xs text-accent font-medium">{title}</span>
    </div>
  );
}

export default function PathRoadmap({ path }: PathRoadmapProps) {
  return (
    <div className="rounded-lg p-4 border border-line bg-surface">
      <div className="flex justify-between items-center mb-6">
        <div className="mono text-2xs text-mute-2 uppercase tracking-mono">
          career path · {path.title}
        </div>
        <div className="mono text-2xs text-mute-3">
          {path.projectedTimelineMonths} months ·{" "}
          {Math.round(path.confidenceScore * 100)}% confidence
        </div>
      </div>

      <div className="pl-1">
        <YouAreHereNode />
        {path.milestones.map((m, i) => (
          <MilestoneNode
            key={m.order}
            milestone={m}
            isLast={i === path.milestones.length - 1}
          />
        ))}
        <TargetNode title={path.title} />
      </div>
    </div>
  );
}
