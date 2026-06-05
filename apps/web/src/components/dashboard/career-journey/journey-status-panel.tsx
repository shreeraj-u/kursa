"use client";

import Link from "next/link";
import type { Route } from "next";
import type { RelevanceSummary } from "@kursa/types";

interface JourneyStatusPanelProps {
    data: RelevanceSummary | null;
}

export default function JourneyStatusPanel({ data }: JourneyStatusPanelProps) {
    if (!data) {
        return (
            <div className="rounded-lg p-4 border border-line bg-surface">
                <p className="mono text-2xs text-mute-2">Could not load journey status.</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg p-4 flex flex-col gap-4 border border-line bg-surface">
            <div className="mono text-2xs text-mute-2">journey status</div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <MetricCard label="journey alignment">
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
                        <p className="text-xs text-mute">Generate a career journey to see alignment.</p>
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
                                    className="mono rounded-full px-2 py-0.5 text-2xs border border-line text-mute"
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
                        <Link
                            href={"/dashboard/career-journey" as Route}
                            className="mono text-2xs text-accent hover:underline"
                        >
                            Profile changed materially — consider regenerating your journey →
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}

function MetricCard({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="rounded-lg p-3 border border-line bg-bg-sub">
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
