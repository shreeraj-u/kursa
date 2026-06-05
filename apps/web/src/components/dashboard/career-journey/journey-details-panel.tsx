import type { ReactNode } from "react";
import type { CareerJourney, CareerJourneyDetails } from "@kursa/types";

interface JourneyDetailsPanelProps {
  journey: CareerJourney;
}

function detailsFor(journey: CareerJourney): CareerJourneyDetails {
  return {
    strategySummary: journey.details?.strategySummary ?? journey.description,
    fitReasons: journey.details?.fitReasons?.length ? journey.details.fitReasons : [journey.description],
    skillGaps: journey.details?.skillGaps ?? [],
    nextActions: journey.details?.nextActions ?? [],
    risks: journey.details?.risks ?? [],
    evidence: journey.details?.evidence ?? [],
    assumptions: journey.details?.assumptions ?? [],
    tradeoffs: journey.details?.tradeoffs ?? [],
    confidenceFactors: journey.details?.confidenceFactors ?? [],
  };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <div className="mono mb-3 text-2xs uppercase tracking-mono text-mute-2">{title}</div>
      {children}
    </section>
  );
}

function EmptyLine({ children }: { children: ReactNode }) {
  return <div className="mono text-2xs text-mute-3">{children}</div>;
}

function BulletList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <EmptyLine>{empty}</EmptyLine>;
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-xs leading-relaxed text-mute-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function JourneyDetailsPanel({ journey }: JourneyDetailsPanelProps) {
  const details = detailsFor(journey);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="advisor strategy">
        <p className="text-sm leading-relaxed text-ink">{details.strategySummary || journey.description}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Metric label="timeline" value={`${journey.projectedTimelineMonths} months`} />
          <Metric label="confidence" value={`${Math.round(journey.confidenceScore * 100)}%`} />
        </div>
      </Section>

      <Section title="why this journey fits">
        <BulletList items={details.fitReasons} empty="No fit reasons generated for this journey." />
      </Section>

      <Section title="confidence factors">
        <BulletList items={details.confidenceFactors ?? []} empty="No confidence factors generated yet." />
      </Section>

      <Section title="assumptions & tradeoffs">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div>
            <div className="mono mb-2 text-2xs text-mute-3">assumptions</div>
            <BulletList items={details.assumptions ?? []} empty="No assumptions listed." />
          </div>
          <div>
            <div className="mono mb-2 text-2xs text-mute-3">tradeoffs</div>
            <BulletList items={details.tradeoffs ?? []} empty="No tradeoffs listed." />
          </div>
        </div>
      </Section>

      <Section title="skill gaps">
        <div className="flex flex-col gap-2">
          {details.skillGaps.length > 0 ? (
            details.skillGaps.map((gap) => (
              <div key={`${gap.skill}-${gap.priority}`} className="rounded-lg border border-line bg-bg-sub-2 p-3">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-ink">{gap.skill}</span>
                  <span className="mono rounded-full border border-line px-1.5 py-px text-2xs text-mute-2">{gap.priority}</span>
                </div>
                <div className="text-xs leading-relaxed text-mute-2">{gap.whyItMatters}</div>
              </div>
            ))
          ) : (
            <EmptyLine>No explicit gaps generated for this journey.</EmptyLine>
          )}
        </div>
      </Section>

      <Section title="risks and mitigations">
        <div className="flex flex-col gap-2">
          {details.risks.length > 0 ? (
            details.risks.map((item) => (
              <div key={item.risk} className="rounded-lg border border-line bg-bg-sub-2 p-3">
                <div className="mb-1 text-xs font-medium text-ink">{item.risk}</div>
                <div className="text-xs leading-relaxed text-mute-2">{item.mitigation}</div>
              </div>
            ))
          ) : (
            <EmptyLine>No major risks generated for this journey.</EmptyLine>
          )}
        </div>
      </Section>

      <Section title="next actions generated with the journey">
        <div className="flex flex-col gap-2">
          {details.nextActions.length > 0 ? (
            details.nextActions.map((action) => (
              <div key={`${action.title}-${action.timeframe}`} className="rounded-lg border border-line bg-bg-sub-2 p-3">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-ink">{action.title}</span>
                  <span className="mono text-2xs text-mute-2">{action.timeframe}</span>
                </div>
                <div className="text-xs leading-relaxed text-mute-2">{action.description}</div>
              </div>
            ))
          ) : (
            <EmptyLine>Regenerate your journey to get recommended next actions.</EmptyLine>
          )}
        </div>
      </Section>

      <Section title="profile evidence used">
        <BulletList items={details.evidence} empty="No profile evidence included on this generated journey." />
      </Section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-bg-sub-2 p-3">
      <div className="mono text-2xs text-mute-3">{label}</div>
      <div className="mt-1 mono text-2xs text-ink">{value}</div>
    </div>
  );
}
