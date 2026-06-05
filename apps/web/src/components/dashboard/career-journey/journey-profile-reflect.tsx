import type { JourneyIntakeSummary } from "@kursa/types";

interface JourneyProfileReflectProps {
  summary: JourneyIntakeSummary;
}

const SOURCE_LABELS: Record<JourneyIntakeSummary["sources"][number], string> = {
  resume: "from your resume",
  onboarding: "from onboarding",
  github: "from GitHub",
  journal: "from your journal",
};

export default function JourneyProfileReflect({ summary }: JourneyProfileReflectProps) {
  return (
    <div className="rounded-xl border border-line bg-bg-sub p-4">
      <div className="mono text-2xs uppercase tracking-mono text-mute-2">what Kursa sees</div>
      <div className="mt-3 grid gap-3 text-sm">
        {(summary.currentRole || summary.targetRole) && (
          <div>
            <span className="text-mute-2">Direction · </span>
            <span className="text-ink">
              {summary.currentRole ?? "Current role"}
              {summary.targetRole ? ` → ${summary.targetRole}` : ""}
            </span>
          </div>
        )}
        {summary.aspirationSnippet && (
          <div>
            <span className="text-mute-2">3y horizon · </span>
            <span className="text-ink">{summary.aspirationSnippet}</span>
          </div>
        )}
        {summary.topSkills.length > 0 && (
          <div>
            <span className="text-mute-2">Top skills · </span>
            <span className="text-ink">{summary.topSkills.slice(0, 5).join(", ")}</span>
          </div>
        )}
        {summary.recentWin && (
          <div>
            <span className="text-mute-2">Recent win · </span>
            <span className="text-ink">{summary.recentWin}</span>
          </div>
        )}
        {summary.constraintsSnippet && (
          <div>
            <span className="text-mute-2">Constraints · </span>
            <span className="text-ink">{summary.constraintsSnippet}</span>
          </div>
        )}
      </div>
      {summary.sources.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {summary.sources.map((source) => (
            <span
              key={source}
              className="mono rounded-full border border-line bg-bg-sub-2 px-2 py-0.5 text-2xs text-mute"
            >
              {SOURCE_LABELS[source]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
