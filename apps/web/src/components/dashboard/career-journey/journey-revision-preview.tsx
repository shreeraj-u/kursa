import type { JourneyRevisionPreview } from "@kursa/types";
import { Button } from "@kursa/ui/components/button";

interface JourneyRevisionPreviewCardProps {
  preview: JourneyRevisionPreview;
  onApply: () => void;
  onKeepRefining: () => void;
  onCancel: () => void;
  applying: boolean;
}

export default function JourneyRevisionPreviewCard({
  preview,
  onApply,
  onKeepRefining,
  onCancel,
  applying,
}: JourneyRevisionPreviewCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4">
      <div>
        <div className="mono text-2xs uppercase tracking-mono text-mute-2">Preview changes</div>
        <p className="mt-2 text-sm text-ink">{preview.summary}</p>
        {preview.userFeedbackSummary && (
          <p className="mt-2 text-xs text-mute-2">You said: {preview.userFeedbackSummary}</p>
        )}
      </div>

      {preview.changes.length > 0 && (
        <ul className="space-y-2">
          {preview.changes.map((change) => (
            <li key={change.target} className="rounded-lg border border-line bg-bg-sub px-3 py-2 text-xs">
              <div className="font-medium text-ink">{change.target}</div>
              <div className="mt-1 text-mute-3 line-through">{change.before}</div>
              <div className="mt-0.5 text-mute-2">{change.after}</div>
            </li>
          ))}
        </ul>
      )}

      {preview.preservedMilestones.length > 0 && (
        <p className="mono text-2xs text-mute-3">
          Preserved milestones: {preview.preservedMilestones.join(", ")}
        </p>
      )}

      {preview.willRebuildEntirePath && (
        <p className="mono text-2xs text-warn">This will rebuild the entire path.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onApply} disabled={applying}>
          {applying ? "Applying…" : "Apply changes"}
        </Button>
        <Button size="sm" variant="outline" onClick={onKeepRefining}>
          Keep refining
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
