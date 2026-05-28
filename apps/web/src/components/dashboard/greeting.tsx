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
            <h1
                style={{
                    fontSize: "var(--text-2xl)",
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    color: "var(--ink)",
                }}
            >
                {greeting}, {firstName}.
            </h1>
            <p
                style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--mute)",
                    lineHeight: 1.55,
                    marginTop: 6,
                }}
            >
               Lets start grinding!
            </p>
        </div>
    );
}
