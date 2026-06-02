"use client";

import type { DashboardMetrics } from "@/types/profile";

interface GreetingProps {
    user: { name: string; createdAt: string };
    metrics: DashboardMetrics | null;
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
        return `You have ${attentionCount} item${attentionCount === 1 ? "" : "s"} needing attention.`;
    }
    if (activeCount > 0) {
        return `You have ${activeCount} application${activeCount === 1 ? "" : "s"} in motion.`;
    }
    if (dayN < 7) {
        return `Day ${dayN}. Keep building your profile.`;
    }
    return "Your profile is up to date.";
}

export default function Greeting({ user, metrics }: GreetingProps) {
    const firstName = user.name.split(" ")[0];
    const greeting = getGreeting();

    return (
        <div>
            <h1 className="text-2xl font-bold tracking-tighter text-ink">
                {greeting}, {firstName}.
            </h1>
            <p className="text-sm text-mute leading-relaxed mt-1.5">
                {getSubtext(metrics)}
            </p>
        </div>
    );
}
