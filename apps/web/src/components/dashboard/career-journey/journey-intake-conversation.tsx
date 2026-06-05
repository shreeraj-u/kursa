"use client";

import { useEffect, useState } from "react";
import type {
  JourneyGrowthPace,
  JourneyIntakeSummary,
  JourneyPreferences,
  JourneyPriority,
} from "@kursa/types";
import { Button } from "@kursa/ui/components/button";
import { api } from "@/lib/api";

import JourneyProfileReflect from "./journey-profile-reflect";

const GROWTH_PACES: Array<{ value: JourneyGrowthPace; label: string }> = [
  { value: "steady", label: "Steady" },
  { value: "accelerated", label: "Accelerated" },
  { value: "exploratory", label: "Exploratory" },
];

const PRIORITIES: Array<{ value: JourneyPriority; label: string }> = [
  { value: "salary", label: "Salary" },
  { value: "stability", label: "Stability" },
  { value: "leadership", label: "Leadership" },
  { value: "autonomy", label: "Autonomy" },
  { value: "learning", label: "Learning" },
  { value: "location", label: "Location" },
  { value: "remote", label: "Remote" },
  { value: "impact", label: "Impact" },
];

const DIRECTION_CHIPS = [
  { id: "senior_ic", label: "Senior IC", patch: { preferredDirection: "Senior individual contributor track" } },
  { id: "staff", label: "Staff / Principal", patch: { preferredDirection: "Staff or principal engineer track" } },
  { id: "em", label: "EM track", patch: { preferredDirection: "Engineering management track" } },
  { id: "explore", label: "Explore / not sure", patch: { preferredDirection: "Explore options — not fully decided yet" } },
] as const;

interface JourneyIntakeConversationProps {
  onGenerate: (preferences: JourneyPreferences, source: "intake" | "quick" | "aria") => void;
  onTalkWithAria?: () => void;
  onCancel?: () => void;
  isSubmitting: boolean;
  error: string | null;
}

export default function JourneyIntakeConversation({
  onGenerate,
  onTalkWithAria,
  onCancel,
  isSubmitting,
  error,
}: JourneyIntakeConversationProps) {
  const [beat, setBeat] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<JourneyIntakeSummary | null>(null);
  const [preferences, setPreferences] = useState<JourneyPreferences | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void api.journey
      .intake()
      .then((data) => {
        if (cancelled) return;
        setSummary(data);
        setPreferences(data.inferredPreferences);
        setLoadError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : "Failed to load profile summary");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = <Key extends keyof JourneyPreferences>(key: Key, value: JourneyPreferences[Key]) => {
    setPreferences((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const togglePriority = (priority: JourneyPriority) => {
    if (!preferences) return;
    const has = preferences.priorities.includes(priority);
    if (has) {
      update("priorities", preferences.priorities.filter((p) => p !== priority));
      return;
    }
    if (preferences.priorities.length >= 3) return;
    update("priorities", [...preferences.priorities, priority]);
  };

  if (loading) {
    return <div className="mono text-2xs text-mute-2">Reading your profile…</div>;
  }

  if (!summary || !preferences) {
    return <div className="mono text-2xs text-warn">{loadError ?? "Could not load intake data."}</div>;
  }

  const commitLine = [
    preferences.preferredDirection || summary.targetRole || "your direction",
    preferences.priorities.length > 0 ? preferences.priorities.join(", ") : "your priorities",
    preferences.growthPace || "steady",
  ];

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-line bg-surface p-5">
      <div className="mono mb-4 text-2xs uppercase tracking-mono text-mute-2">
        journey conversation · beat {beat}/3
      </div>

      {beat === 1 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-mute-2">
            From your profile, here&apos;s the direction I&apos;m seeing. Does this look right?
          </p>
          <JourneyProfileReflect summary={summary} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setBeat(2)} size="sm">
              Looks right
            </Button>
            <Button onClick={() => setBeat(2)} variant="outline" size="sm">
              Adjust
            </Button>
            <Button
              onClick={() => onGenerate(summary.inferredPreferences, "quick")}
              variant="outline"
              size="sm"
              disabled={isSubmitting}
            >
              Generate from my profile
            </Button>
          </div>
        </div>
      )}

      {beat === 2 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-mute-2">Steer the path — only what&apos;s missing.</p>

          <div>
            <div className="mono mb-2 text-2xs uppercase tracking-mono text-mute-2">direction</div>
            <div className="flex flex-wrap gap-2">
              {DIRECTION_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => {
                    setSelectedDirection(chip.id);
                    setPreferences((prev) => (prev ? { ...prev, ...chip.patch } : prev));
                  }}
                  className={`mono rounded-md border px-2.5 py-1 text-2xs ${
                    selectedDirection === chip.id
                      ? "border-accent bg-accent text-white"
                      : "border-line bg-bg-sub-2 text-mute"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mono mb-2 text-2xs uppercase tracking-mono text-mute-2">pace</div>
            <div className="flex flex-wrap gap-2">
              {GROWTH_PACES.map((pace) => (
                <button
                  key={pace.value}
                  type="button"
                  onClick={() => update("growthPace", pace.value)}
                  className={`mono rounded-md border px-2.5 py-1 text-2xs ${
                    preferences.growthPace === pace.value
                      ? "border-accent bg-accent text-white"
                      : "border-line bg-bg-sub-2 text-mute"
                  }`}
                >
                  {pace.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mono mb-2 text-2xs uppercase tracking-mono text-mute-2">top priorities (up to 3)</div>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => togglePriority(p.value)}
                  className={`mono rounded-md border px-2.5 py-1 text-2xs ${
                    preferences.priorities.includes(p.value)
                      ? "border-accent bg-accent text-white"
                      : "border-line bg-bg-sub-2 text-mute"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mono text-2xs uppercase tracking-mono text-mute-2">one constraint line</span>
            <input
              value={preferences.hardConstraints}
              onChange={(e) => update("hardConstraints", e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-sm text-ink"
              placeholder="e.g. remote only, no relocation"
            />
          </label>

          <label className="block">
            <span className="mono text-2xs uppercase tracking-mono text-mute-2">anything to avoid?</span>
            <input
              value={preferences.avoid}
              onChange={(e) => update("avoid", e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-sm text-ink"
            />
          </label>

          <div className="flex gap-2">
            <Button onClick={() => setBeat(3)} size="sm">
              Continue
            </Button>
            <Button onClick={() => setBeat(1)} variant="outline" size="sm">
              Back
            </Button>
          </div>
        </div>
      )}

      {beat === 3 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink">
            I&apos;ll generate one journey toward <strong>{commitLine[0]}</strong>, prioritizing{" "}
            <strong>{commitLine[1]}</strong>, at a <strong>{commitLine[2]}</strong> pace.
          </p>

          <details className="rounded-lg border border-line bg-bg-sub px-3 py-2">
            <summary className="cursor-pointer text-xs text-mute">Add a note for Aria (optional)</summary>
            <textarea
              value={preferences.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-md border border-line bg-bg px-3 py-2 text-sm text-ink"
            />
          </details>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onGenerate(preferences, "intake")} disabled={isSubmitting} size="sm">
              {isSubmitting ? "Generating…" : "Generate my journey"}
            </Button>
            {onTalkWithAria && (
              <Button type="button" variant="outline" size="sm" onClick={onTalkWithAria}>
                Talk it through with Aria
              </Button>
            )}
            <Button onClick={() => setBeat(2)} variant="outline" size="sm">
              Back
            </Button>
          </div>
        </div>
      )}

      {(error || loadError) && <div className="mt-3 mono text-2xs text-warn">{error ?? loadError}</div>}
      {onCancel && (
        <button type="button" onClick={onCancel} className="mt-4 mono text-2xs text-mute-3 hover:text-mute">
          cancel
        </button>
      )}
    </div>
  );
}
