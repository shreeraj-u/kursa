import type { CareerJourney } from "@kursa/types";
import JourneyDetailsPanel from "./journey-details-panel";

interface JourneyWhyDrawerProps {
  journey: CareerJourney;
  onOpenFull?: () => void;
}

export default function JourneyWhyDrawer({ journey, onOpenFull }: JourneyWhyDrawerProps) {
  const details = journey.details;
  const fitReasons = details?.fitReasons?.slice(0, 3) ?? [];
  const risks = details?.risks?.slice(0, 2) ?? [];
  const confidenceFactors = details?.confidenceFactors?.slice(0, 3) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-mute-2">
        How achievable this path is given your profile today:{" "}
        <span className="font-medium text-ink">{Math.round(journey.confidenceScore * 100)}%</span>
      </p>

      {fitReasons.length > 0 && (
        <section>
          <div className="mono text-2xs uppercase tracking-mono text-mute-2">Why this fits</div>
          <ul className="mt-2 space-y-1.5">
            {fitReasons.map((reason) => (
              <li key={reason} className="text-sm text-mute-2">
                {reason}
              </li>
            ))}
          </ul>
        </section>
      )}

      {risks.length > 0 && (
        <section>
          <div className="mono text-2xs uppercase tracking-mono text-mute-2">Top risks</div>
          <ul className="mt-2 space-y-2">
            {risks.map((r) => (
              <li key={r.risk} className="rounded-lg border border-line bg-bg-sub px-3 py-2 text-sm">
                <div className="text-ink">{r.risk}</div>
                <div className="mt-1 text-xs text-mute-2">{r.mitigation}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {confidenceFactors.length > 0 && (
        <section>
          <div className="mono text-2xs uppercase tracking-mono text-mute-2">Confidence factors</div>
          <ul className="mt-2 space-y-1 text-xs text-mute-2">
            {confidenceFactors.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>
      )}

      {onOpenFull && (
        <button
          type="button"
          onClick={onOpenFull}
          className="mono self-start text-2xs text-accent hover:underline"
        >
          Why Kursa chose this path →
        </button>
      )}
    </div>
  );
}

export function JourneyWhyFullPanel({ journey }: { journey: CareerJourney }) {
  return (
    <div>
      <div className="mono mb-3 text-2xs uppercase tracking-mono text-mute-2">
        Why Kursa chose this path
      </div>
      <JourneyDetailsPanel journey={journey} />
    </div>
  );
}
