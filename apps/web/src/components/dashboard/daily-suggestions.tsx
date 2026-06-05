"use client";

import Link from "next/link";
import type { Route } from "next";
import type { ProactiveNudge } from "@kursa/types";

interface DailySuggestionsProps {
    nudges: ProactiveNudge[];
}

function nudgeHref(n: ProactiveNudge): Route {
    if (n.actionHref) {
        if (n.actionHref === "/dashboard/career-journey") {
            return `/dashboard/aria?prompt=${encodeURIComponent("My profile shifted — should we revisit my career paths?")}` as Route;
        }
        return n.actionHref as Route;
    }
    return `/dashboard/aria?prompt=${encodeURIComponent(n.message)}` as Route;
}

export default function DailySuggestions({ nudges }: DailySuggestionsProps) {
    const shown = nudges.slice(0, 3);

    return (
        <div>
            <div className="mono mb-3 text-2xs text-mute-2">
                daily suggestions
                {nudges.length > 0 && (
                    <span>
                        {" "}
                        · {nudges.length} item{nudges.length === 1 ? "" : "s"}
                    </span>
                )}
            </div>
            <p className="mb-3 text-xs leading-relaxed text-mute">
                Actionable next steps from your profile, journal, and journey.
            </p>

            {shown.length === 0 ? (
                <p className="text-xs text-mute-2 py-2">
                    You&apos;re caught up — log a win or update your profile to refresh suggestions.
                </p>
            ) : (
                <div className="flex flex-col gap-2">
                    {shown.map((n) => (
                        <div
                            key={n.id}
                            className="rounded-md px-3 py-2.5"
                            style={{
                                border: "1px solid var(--line)",
                                background: n.priority === "high" ? "var(--accent-soft)" : "var(--bg-sub)",
                            }}
                        >
                            <div className="text-xs font-medium text-ink">{n.title}</div>
                            <p className="text-xs text-mute mt-1 leading-relaxed">{n.message}</p>
                            <Link
                                href={nudgeHref(n)}
                                className="mono inline-block mt-2 text-2xs text-accent hover:underline"
                            >
                                {n.actionLabel ?? "Ask Aria"} →
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
