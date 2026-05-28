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

export default function Greeting({ user, metrics }: GreetingProps) {
    const firstName = user.name.split(" ")[0];
    const greeting = getGreeting();

    return (
        <div>
            <h1 className="text-2xl font-bold tracking-tighter text-ink">
                {greeting}, {firstName}.
            </h1>
            <p className="text-sm text-mute leading-relaxed mt-1.5">
               Lets start grinding!
            </p>
        </div>
    );
}
