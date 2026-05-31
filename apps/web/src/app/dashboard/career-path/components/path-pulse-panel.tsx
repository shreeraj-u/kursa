"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";

import { JournalEngagementChart } from "../../journal/journal-engagement-chart";

type RelevanceData = Awaited<ReturnType<typeof api.journal.relevance>>;

export default function PathPulsePanel() {
  const [data, setData] = useState<RelevanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api.journal
      .relevance()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        className="rounded-lg p-4"
        style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
      >
        <p className="mono text-2xs text-mute-2">Loading path pulse…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="rounded-lg p-4"
        style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
      >
        <p className="mono text-2xs text-mute-2">Could not load path pulse.</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg p-4 flex flex-col gap-4"
      style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
    >
      <div className="mono text-2xs text-mute-2">path pulse</div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard label="path alignment">
          {data.pathAlignmentScore !== null ? (
            <div className="flex items-center gap-3">
              <AlignmentRing score={data.pathAlignmentScore} />
              <div>
                <div className="text-lg font-medium text-ink">{data.pathAlignmentScore}%</div>
                {data.activePathTitle && (
                  <div className="mono text-2xs text-mute-2">{data.activePathTitle}</div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-mute">Generate a career path to see alignment.</p>
          )}
        </MetricCard>

        <MetricCard label="accomplishments this quarter">
          <div className="text-2xl font-medium text-ink">{data.winsThisQuarter}</div>
          {data.checkInStreak > 0 && (
            <div className="mono text-2xs text-mute-2 mt-1">{data.checkInStreak}w check-in streak</div>
          )}
        </MetricCard>

        <MetricCard label="stale skills">
          {data.staleSkills.length === 0 ? (
            <p className="text-xs text-mute-2">All high-confidence skills recently used</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {data.staleSkills.map((skill) => (
                <span
                  key={skill}
                  className="mono rounded-full px-2 py-0.5 text-2xs"
                  style={{ border: "1px solid var(--line)", color: "var(--mute)" }}
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </MetricCard>
      </div>

      {(data.intentionActionGap || data.materialChangeDetected) && (
        <div
          className="rounded-lg px-3 py-2"
          style={{ border: "1px solid var(--accent-line)", background: "var(--accent-soft)" }}
        >
          {data.intentionActionGap && (
            <p className="text-xs text-ink mb-1">
              Your stated intentions and recent actions may be drifting apart.
            </p>
          )}
          {data.materialChangeDetected && (
            <p className="mono text-2xs text-accent">
              Profile changed materially — use regenerate paths above.
            </p>
          )}
        </div>
      )}

      {data.milestoneEvidence && data.milestoneEvidence.length > 0 && (
        <div>
          <div className="mono text-2xs text-mute-2 mb-2">milestone evidence</div>
          {data.milestoneEvidence.slice(0, 3).map((m) => (
            <div key={m.order} className="mb-2">
              <div className="text-xs text-ink">{m.title}</div>
              <div className="mono text-2xs text-mute-3">
                {m.eventCount} events · {m.status.replace("_", " ")}
              </div>
            </div>
          ))}
        </div>
      )}

      <JournalEngagementChart data={data.engagementTrend} height={56} />

      {data.memories.length > 0 && (
        <div>
          <div className="mono text-2xs text-mute-2 mb-2">distilled memories</div>
          <div className="flex flex-col gap-3">
            {data.memories.map((mem) => (
              <div key={mem.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="mono text-2xs text-mute-3">{mem.category}</span>
                  <span className="mono text-2xs text-mute-3">
                    {Math.round(mem.confidence * 100)}% conf
                  </span>
                </div>
                <p className="text-xs text-ink leading-relaxed">{mem.fact}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link href={"/dashboard/docs" as Route} className="mono text-2xs text-mute-2 underline">
        Learn how path pulse works →
      </Link>
    </div>
  );
}

function MetricCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg p-3"
      style={{ border: "1px solid var(--line)", background: "var(--bg-sub)" }}
    >
      <div className="mono text-2xs text-mute-2 mb-2">{label}</div>
      {children}
    </div>
  );
}

function AlignmentRing({ score }: { score: number }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <svg width={48} height={48} viewBox="0 0 48 48">
      <circle cx={24} cy={24} r={r} fill="none" stroke="var(--line)" strokeWidth={3} />
      <circle
        cx={24}
        cy={24}
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={3}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
      />
    </svg>
  );
}
