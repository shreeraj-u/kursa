"use client";

import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/dashboard/page-header";
import { DASHBOARD_PAGE_HELP } from "@/components/dashboard/page-help";
import Greeting from "@/components/dashboard/greeting";
import CareerPulse from "@/components/dashboard/career-pulse";
import AriaNoticed from "@/components/dashboard/aria-noticed";
import InFlight from "@/components/dashboard/in-flight";
import RecentActivity from "@/components/dashboard/recent-activity";
import CheckinPrompt from "@/components/dashboard/checkin-prompt";
import TopAction from "@/components/dashboard/top-action";
import JourneyPulsePanel from "@/components/dashboard/career-journey/journey-pulse-panel";
import { api } from "@/lib/api";
import type { UserProfile, ObservationsResponse, DashboardMetrics } from "@/types/profile";
import type { CareerJourney, JourneyActionItem } from "@kursa/types";

interface DashboardProps {
    profile: UserProfile | null;
    user: { name: string; email: string; createdAt: string };
    initialObservations: ObservationsResponse | null;
    observationsError?: string | null;
    metrics: DashboardMetrics | null;
    topAction: JourneyActionItem | null;
    activeJourney: CareerJourney | null;
}

function buildDigest(
    user: DashboardProps["user"],
    metrics: DashboardMetrics | null,
    topAction: JourneyActionItem | null,
    pulse: { pathAlignmentScore: number | null; winsThisQuarter: number; checkInStreak: number; staleSkills: string[]; activePathTitle: string | null; recentMemoryFacts?: string[]; memories?: Array<{ id: string }> } | null,
    activeJourney: CareerJourney | null,
    observations: ObservationsResponse | null,
): string {
    const week = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const lines: string[] = [`# Career Digest`, `Exported ${week}`, ``, `---`, ``];

    if (activeJourney || pulse?.pathAlignmentScore !== null && pulse?.pathAlignmentScore !== undefined) {
        lines.push(`## Active Journey`);
        lines.push(activeJourney ? `- ${activeJourney.title}` : `- ${pulse?.activePathTitle ?? "No active journey"}`);
        if (pulse?.pathAlignmentScore !== null && pulse?.pathAlignmentScore !== undefined) {
            lines.push(`- Alignment: ${pulse.pathAlignmentScore}%`);
        }
        if (activeJourney?.description) lines.push(`- ${activeJourney.description}`);
        lines.push(``);
    }

    if (pulse) {
        lines.push(`## Accomplishments`);
        lines.push(`- ${pulse.winsThisQuarter} win${pulse.winsThisQuarter !== 1 ? "s" : ""} this quarter`);
        if (pulse.checkInStreak > 0) lines.push(`- ${pulse.checkInStreak}-week check-in streak`);
        lines.push(``);
    }

    if (metrics?.pulse) {
        lines.push(`## Career Pulse`);
        lines.push(`- Growth: ${metrics.pulse.growth.trend} — ${metrics.pulse.growth.observation}`);
        lines.push(`- Visibility: ${metrics.pulse.visibility.trend} — ${metrics.pulse.visibility.observation}`);
        lines.push(`- Progression: ${metrics.pulse.progression.trend} — ${metrics.pulse.progression.observation}`);
        lines.push(``);
    }

    if (topAction) {
        lines.push(`## Top Action`);
        lines.push(`- [${topAction.urgency}] ${topAction.title}`);
        if (topAction.subtitle) lines.push(topAction.subtitle);
        if (topAction.daysRemaining !== null) lines.push(`Due in ${topAction.daysRemaining} day${topAction.daysRemaining !== 1 ? "s" : ""}`);
        lines.push(``);
    }

    const skillGaps = activeJourney?.details?.skillGaps ?? [];
    if (skillGaps.length > 0 || (pulse && pulse.staleSkills.length > 0)) {
        lines.push(`## Skills`);
        if (skillGaps.length > 0) {
            lines.push(`### Journey gaps`);
            skillGaps.slice(0, 8).forEach((gap) => lines.push(`- ${gap.skill} (${gap.priority}) — ${gap.whyItMatters}`));
        }
        if (pulse && pulse.staleSkills.length > 0) {
            lines.push(`### Stale skills`);
            pulse.staleSkills.forEach((skill) => lines.push(`- ${skill}`));
        }
        lines.push(``);
    }

    if (metrics?.inFlight && metrics.inFlight.activeCount > 0) {
        lines.push(`## Active Applications (${metrics.inFlight.activeCount})`);
        metrics.inFlight.applications
            .filter((a) => a.stageLabel !== "not aligned")
            .forEach((a) => lines.push(`- ${a.company} — ${a.roleTitle} — ${a.stageLabel}`));
        lines.push(``);
    }

    if (metrics?.recentActivity && metrics.recentActivity.length > 0) {
        lines.push(`## Recent Activity`);
        metrics.recentActivity.forEach((e) => lines.push(`- ${e.label} (${e.timeAgo})`));
        lines.push(``);
    }

    if (observations) {
        lines.push(`## Aria Observations`);
        lines.push(`- Count: ${observations.pagination.total}`);
        lines.push(`- Source: ${observations.generationSource}`);
        observations.data.slice(0, 4).forEach((obs) => lines.push(`- ${obs.text}`));
        lines.push(``);
    }

    if (pulse?.recentMemoryFacts?.length) {
        lines.push(`## Memory Facts`);
        pulse.recentMemoryFacts.slice(0, 5).forEach((fact) => lines.push(`- ${fact}`));
        lines.push(``);
    }

    lines.push(`---`);
    lines.push(`Generated by Kursa for ${user.name}`);
    return lines.join("\n");
}

const DEMO_SIGNALS = [
    { label: "memory", value: "profile + journal", help: "durable career context" },
    { label: "reasoning", value: "journey + gaps", help: "why this path fits" },
    { label: "execution", value: "resume + apps", help: "turn advice into action" },
];

export default function Dashboard({ profile, user, initialObservations, observationsError, metrics, topAction, activeJourney }: DashboardProps) {
    const [exporting, setExporting] = useState(false);

    async function handleExport() {
        setExporting(true);
        try {
            const pulse = await api.journal.relevance().catch(() => null);
            const digest = buildDigest(user, metrics, topAction, pulse, activeJourney, initialObservations);
            const blob = new Blob([digest], { type: "text/markdown" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `kursa-digest-${new Date().toISOString().slice(0, 10)}.md`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setExporting(false);
        }
    }

    return (
        <div className="flex flex-col min-h-full">
            <PageHeader pageTitle="Home" />

            {/* Greeting row */}
            <div className="px-8 pt-6 pb-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <Greeting user={user} metrics={metrics} help={DASHBOARD_PAGE_HELP.home} />
                <div className="flex items-center gap-2 mt-1.5 self-start sm:self-auto flex-shrink-0">
                    <Link
                        href="/dashboard/journal"
                        className="rounded-md px-3 py-1.5 mono transition-colors text-xs text-accent border border-line bg-bg hover:bg-surface"
                    >
                        log a win →
                    </Link>
                    <button
                        onClick={() => void handleExport()}
                        disabled={exporting}
                        className="rounded-md px-3 py-1.5 mono transition-colors text-xs text-mute border border-line bg-bg cursor-pointer disabled:opacity-50"
                    >
                        {exporting ? "exporting…" : "export career digest"}
                    </button>
                </div>
            </div>

            <div className="px-8 pb-5 grid grid-cols-1 gap-2 md:grid-cols-3">
                {DEMO_SIGNALS.map((signal) => (
                    <div key={signal.label} className="rounded-lg border border-line bg-surface px-4 py-3">
                        <div className="mono text-2xs uppercase tracking-mono text-mute-2">{signal.label}</div>
                        <div className="mt-1 text-sm font-medium text-ink">{signal.value}</div>
                        <div className="mt-0.5 text-xs leading-relaxed text-mute">{signal.help}</div>
                    </div>
                ))}
            </div>

            {/* Main grid */}
            <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 flex-1">
                {/* Left column */}
                <div className="flex flex-col gap-4">
                    {/* Checkin prompt — renders only when a check-in is due */}
                    <CheckinPrompt />

                    {/* Top journey action */}
                    {topAction && <TopAction item={topAction} />}

                    {/* Career pulse card */}
                    <div className="rounded-lg p-4 border border-line bg-surface">
                        <div className="mono mb-3 text-2xs text-mute-2">
                            career pulse
                        </div>
                        <CareerPulse metrics={metrics} />
                    </div>

                    {/* Journey pulse card */}
                    <JourneyPulsePanel />

                    {/* Aria noticed card */}
                    <div className="rounded-lg p-4 border border-line bg-surface">
                        <AriaNoticed
                            initialObservations={initialObservations}
                            initialError={observationsError}
                        />
                    </div>
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-4">
                    {/* In flight card */}
                    <div className="rounded-lg p-4 border border-line bg-surface">
                        <InFlight metrics={metrics} />
                    </div>

                    {/* Recent activity card */}
                    <div className="rounded-lg p-4 border border-line bg-surface">
                        <RecentActivity metrics={metrics} />
                    </div>
                </div>
            </div>
        </div>
    );
}
