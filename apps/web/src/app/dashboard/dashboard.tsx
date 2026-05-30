"use client";

import PageHeader from "@/components/dashboard/page-header";
import Greeting from "@/components/dashboard/greeting";
import CareerPulse from "@/components/dashboard/career-pulse";
import AriaNoticed from "@/components/dashboard/aria-noticed";
import InFlight from "@/components/dashboard/in-flight";
import RecentActivity from "@/components/dashboard/recent-activity";
import type { UserProfile, ObservationsResponse, DashboardMetrics } from "@/types/profile";

interface DashboardProps {
    profile: UserProfile | null;
    user: { name: string; email: string; createdAt: string };
    initialObservations: ObservationsResponse | null;
    observationsError?: string | null;
    metrics: DashboardMetrics | null;
}

export default function Dashboard({ profile, user, initialObservations, observationsError, metrics }: DashboardProps) {
    const attentionCount = metrics?.greeting.attentionCount ?? 0;

    return (
        <div className="flex flex-col min-h-full">
            <PageHeader pageTitle="Home" />

            {/* Greeting row */}
            <div className="px-8 pt-6 pb-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <Greeting user={user} metrics={metrics} />
                {/* export button */}
                <button className="flex-shrink-0 rounded-md px-3 py-1.5 mono transition-colors text-xs text-mute border border-line bg-bg cursor-pointer mt-1.5 self-start sm:self-auto">
                    export weekly digest
                </button>
            </div>

            {/* Main grid */}
            <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 flex-1">
                {/* Left column */}
                <div className="flex flex-col gap-4">
                    {/* Career pulse card */}
                    <div className="rounded-lg p-4 border border-line bg-surface">
                        <div className="mono mb-3 text-2xs text-mute-2">
                            career pulse
                        </div>
                        <CareerPulse metrics={metrics} />
                    </div>

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
