"use client";

import PageHelpButton from "@/components/dashboard/page-help-button";
import type { DashboardPageHelp } from "@/components/dashboard/page-help";
import type { DashboardMetrics } from "@/types/profile";

interface GreetingProps {
    user: { name: string; createdAt: string };
    metrics: DashboardMetrics | null;
    help?: DashboardPageHelp;
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

function getSubtext(metrics: DashboardMetrics | null): string {
    const attentionCount = metrics?.greeting.attentionCount ?? 0;
    const dayN = metrics?.greeting.dayN ?? 0;
    const activeCount = metrics?.inFlight.activeCount ?? 0;

    if (attentionCount > 0) {
        return `Kursa found ${attentionCount} career signal${attentionCount === 1 ? "" : "s"} that need attention.`;
    }
    if (activeCount > 0) {
        return `${activeCount} application${activeCount === 1 ? " is" : "s are"} in motion — keep the evidence loop warm.`;
    }
    if (dayN < 7) {
        return `Day ${dayN}. Every profile update, win, and note makes Aria more specific.`;
    }
    return "Your profile memory is current. Review what changed and pick the next action.";
}

export default function Greeting({ user, metrics, help }: GreetingProps) {
    const firstName = user.name.split(" ")[0];
    const greeting = getGreeting();

    return (
        <div>
            <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tighter text-ink">
                    {greeting}, {firstName}.
                </h1>
                {help && <PageHelpButton help={help} label="Home" />}
            </div>
            <p className="text-sm text-mute leading-relaxed mt-1.5">
                {getSubtext(metrics)}
            </p>
        </div>
    );
}
