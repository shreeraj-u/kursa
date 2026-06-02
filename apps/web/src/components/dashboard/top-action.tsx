import Link from "next/link";
import type { JourneyActionItem } from "@kursa/types";
import type { Route } from "next";

const DOMAIN_LABEL: Record<string, string> = { path: "journey", skill: "skill", application: "app" };
const DOMAIN_COLOR: Record<string, string> = {
    path: "var(--accent)",
    skill: "#6366f1",
    application: "#059669",
};

export default function TopAction({ item }: { item: JourneyActionItem }) {
    const color = DOMAIN_COLOR[item.domain] ?? "var(--accent)";

    return (
        <Link
            href={item.linkTo as Route}
            className="rounded-lg px-4 py-3 flex items-center gap-3 border border-line group"
            style={{ background: "var(--surface)", textDecoration: "none" }}
        >
            <span
                className="mono rounded px-1.5 py-0.5 flex-shrink-0"
                style={{
                    fontSize: 9,
                    background: `color-mix(in srgb, ${color} 12%, transparent)`,
                    color,
                    border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
                }}
            >
                {DOMAIN_LABEL[item.domain] ?? item.domain}
            </span>

            <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-ink group-hover:underline block truncate">
                    {item.title}
                </span>
                {item.subtitle && (
                    <span className="text-2xs text-mute-2 block truncate mt-0.5">{item.subtitle}</span>
                )}
            </div>

            {item.daysRemaining !== null && (
                <span
                    className="mono text-2xs flex-shrink-0"
                    style={{ color: item.daysRemaining <= 0 ? "var(--warn)" : "var(--mute-3)" }}
                >
                    {item.daysRemaining <= 0 ? "overdue" : `${item.daysRemaining}d`}
                </span>
            )}

            <span className="mono text-2xs text-mute-3 flex-shrink-0">→</span>
        </Link>
    );
}
