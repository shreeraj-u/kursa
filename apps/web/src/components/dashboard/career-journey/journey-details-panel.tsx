import type { ReactNode } from "react";
import type { CareerJourney, CareerJourneyDetails } from "@kursa/types";

interface JourneyDetailsPanelProps {
  journey: CareerJourney;
}

function detailsFor(journey: CareerJourney): CareerJourneyDetails {
  return {
    fitReasons: journey.details?.fitReasons?.length
      ? journey.details.fitReasons
      : [journey.description],
    skillGaps: journey.details?.skillGaps ?? [],
    nextActions: journey.details?.nextActions ?? [],
    risks: journey.details?.risks ?? [],
    evidence: journey.details?.evidence ?? [],
  };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="py-4 border-t border-line first:border-t-0 first:pt-0">
      <div className="mono text-2xs text-mute-2 uppercase tracking-mono mb-3">
        {title}
      </div>
      {children}
    </section>
  );
}

function EmptyLine({ children }: { children: ReactNode }) {
  return <div className="mono text-2xs text-mute-3">{children}</div>;
}

export default function JourneyDetailsPanel({ journey }: JourneyDetailsPanelProps) {
  const details = detailsFor(journey);

  return (
    <div className="flex flex-col">
      <Section title="why this journey fits">
        <div className="flex flex-col gap-2">
          {details.fitReasons.map((reason) => (
            <div
              key={reason}
              className="text-xs text-ink leading-relaxed border-l border-[var(--accent-line)] pl-3"
            >
              {reason}
            </div>
          ))}
        </div>
      </Section>

      <Section title="skill gaps">
        <div className="flex flex-col gap-2">
          {details.skillGaps.length > 0 ? (
            details.skillGaps.map((gap) => (
              <div
                key={`${gap.skill}-${gap.priority}`}
                className="rounded-md border border-line bg-bg-sub-2 p-3"
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-xs text-ink font-medium">{gap.skill}</span>
                  <span className="mono text-2xs text-mute-2 border border-line rounded-full px-1.5 py-px">
                    {gap.priority}
                  </span>
                </div>
                <div className="text-xs text-mute-2">{gap.whyItMatters}</div>
              </div>
            ))
          ) : (
            <EmptyLine>No explicit gaps generated for this journey.</EmptyLine>
          )}
        </div>
      </Section>

      <Section title="next actions">
        <div className="flex flex-col gap-2">
          {details.nextActions.length > 0 ? (
            details.nextActions.map((action) => (
              <div
                key={`${action.title}-${action.timeframe}`}
                className="rounded-md border border-line bg-bg-sub-2 p-3"
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-xs text-ink font-medium">{action.title}</span>
                  <span className="mono text-2xs text-mute-2">{action.timeframe}</span>
                </div>
                <div className="text-xs text-mute-2">{action.description}</div>
              </div>
            ))
          ) : (
            <EmptyLine>Regenerate your journey to get recommended next actions.</EmptyLine>
          )}
        </div>
      </Section>

      <Section title="risks and mitigations">
        <div className="flex flex-col gap-2">
          {details.risks.length > 0 ? (
            details.risks.map((item) => (
              <div
                key={item.risk}
                className="rounded-md border border-line bg-bg-sub-2 p-3"
              >
                <div className="text-xs text-ink font-medium mb-1">{item.risk}</div>
                <div className="text-xs text-mute-2">{item.mitigation}</div>
              </div>
            ))
          ) : (
            <EmptyLine>No major risks generated for this journey.</EmptyLine>
          )}
        </div>
      </Section>

      <Section title="profile evidence">
        <div className="flex flex-col gap-2">
          {details.evidence.length > 0 ? (
            details.evidence.map((evidence) => (
              <div
                key={evidence}
                className="mono text-2xs text-mute-2 rounded-md border border-line bg-bg-sub-2 p-2"
              >
                {evidence}
              </div>
            ))
          ) : (
            <EmptyLine>No profile evidence included on this generated journey.</EmptyLine>
          )}
        </div>
      </Section>
    </div>
  );
}
