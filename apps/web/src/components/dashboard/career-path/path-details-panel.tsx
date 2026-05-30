import type { ReactNode } from "react";
import type { CareerPath, CareerPathDetails } from "@kursa/types";
import { Button } from "@kursa/ui/components/button";

interface PathDetailsPanelProps {
  path: CareerPath;
  isActive: boolean;
  activating: boolean;
  onActivate: () => void;
}

function detailsFor(path: CareerPath): CareerPathDetails {
  return {
    fitReasons: path.details?.fitReasons?.length
      ? path.details.fitReasons
      : [path.description],
    skillGaps: path.details?.skillGaps ?? [],
    nextActions: path.details?.nextActions ?? [],
    risks: path.details?.risks ?? [],
    evidence: path.details?.evidence ?? [],
  };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-surface p-4">
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

export default function PathDetailsPanel({
  path,
  isActive,
  activating,
  onActivate,
}: PathDetailsPanelProps) {
  const details = detailsFor(path);

  return (
    <div className="grid grid-cols-[1.15fr_0.85fr] gap-4 max-xl:grid-cols-1">
      <Section title="why this path fits">
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

      <Section title="focus state">
        <div className="flex flex-col gap-3">
          <div className="text-xs text-mute-2">
            {isActive
              ? "This is your active path. Downstream resume and skill-gap features can align to it."
              : "Previewing only. Set it active when you want Kursa to use it as your primary focus."}
          </div>
          <Button
            onClick={onActivate}
            disabled={isActive || activating}
            variant="outline"
            size="sm"
            className="mono text-ink border-line rounded-sm bg-bg hover:bg-bg-sub-2 self-start"
          >
            {isActive
              ? "active path"
              : activating
                ? "setting active…"
                : "set active path"}
          </Button>
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
            <EmptyLine>No explicit gaps generated for this path.</EmptyLine>
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
            <EmptyLine>Regenerate paths to get recommended next actions.</EmptyLine>
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
            <EmptyLine>No major risks generated for this path.</EmptyLine>
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
            <EmptyLine>No profile evidence included on older generated paths.</EmptyLine>
          )}
        </div>
      </Section>
    </div>
  );
}
