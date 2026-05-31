"use client";

import Link from "next/link";
import type { Route } from "next";

import { JournalEngagementChart } from "./journal-engagement-chart";
import type { RelevanceSummary } from "@kursa/types";

type Props = {
  data: RelevanceSummary | null;
  loading?: boolean;
};

export function JournalRelevance({ data, loading }: Props) {
  if (loading) {
    return (
      <p className="mono" style={{ fontSize: 9, color: "var(--mute-2)" }}>
        Loading intelligence…
      </p>
    );
  }

  if (!data) {
    return (
      <p style={{ fontSize: "var(--text-xs)", color: "var(--mute-2)" }}>
        Log entries to unlock path pulse insights.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="mono" style={{ fontSize: 9, color: "var(--mute-2)" }}>
        path pulse
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MiniStat label="alignment">
          {data.pathAlignmentScore !== null ? `${data.pathAlignmentScore}%` : "—"}
        </MiniStat>
        <MiniStat label="wins (90d)">{data.winsThisQuarter}</MiniStat>
        <MiniStat label="check-in streak">{data.checkInStreak ?? 0}w</MiniStat>
        <MiniStat label="activity">{data.journalActivityScore ?? 0}%</MiniStat>
      </div>

      {data.activePathTitle && (
        <p className="mono" style={{ fontSize: 8, color: "var(--mute-3)" }}>
          {data.activePathTitle}
        </p>
      )}

      {(data.intentionActionGap || data.materialChangeDetected) && (
        <div
          className="rounded px-2 py-1.5"
          style={{ border: "1px solid var(--accent-line)", background: "var(--accent-soft)" }}
        >
          {data.intentionActionGap && (
            <p style={{ fontSize: 10, color: "var(--ink)" }}>
              Intentions and recent activity may be drifting.
            </p>
          )}
          {data.materialChangeDetected && (
            <Link
              href={"/dashboard/career-path" as Route}
              className="mono block mt-1"
              style={{ fontSize: 8, color: "var(--accent)" }}
            >
              Consider regenerating paths →
            </Link>
          )}
        </div>
      )}

      {data.milestoneEvidence?.length ? (
        <div>
          <div className="mono mb-1.5" style={{ fontSize: 8, color: "var(--mute-3)" }}>
            milestone evidence
          </div>
          {data.milestoneEvidence.slice(0, 3).map((m) => (
            <div key={m.order} className="mb-1.5">
              <div style={{ fontSize: 10, color: "var(--ink)" }}>{m.title}</div>
              <div className="mono" style={{ fontSize: 8, color: "var(--mute-3)" }}>
                {m.eventCount} events · {m.status.replace("_", " ")}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {data.staleSkills?.length ? (
        <div>
          <div className="mono mb-1" style={{ fontSize: 8, color: "var(--mute-3)" }}>
            stale skills
          </div>
          <div className="flex flex-wrap gap-1">
            {data.staleSkills.slice(0, 4).map((s) => (
              <span
                key={s}
                className="mono rounded-full px-1.5 py-0.5"
                style={{ fontSize: 8, border: "1px solid var(--line)", color: "var(--mute)" }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <JournalEngagementChart
        data={data.engagementTrend ?? []}
        trendLabel={data.engagementTrendLabel}
        height={48}
        compact
      />
    </div>
  );
}

function MiniStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded p-2"
      style={{ border: "1px solid var(--line)", background: "var(--bg-sub)" }}
    >
      <div className="mono mb-0.5" style={{ fontSize: 7, color: "var(--mute-3)" }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{children}</div>
    </div>
  );
}
