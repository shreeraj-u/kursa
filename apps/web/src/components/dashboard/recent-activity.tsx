import type { DashboardMetrics } from "@/types/profile";

interface RecentActivityProps {
    metrics: DashboardMetrics | null;
}

export default function RecentActivity({ metrics }: RecentActivityProps) {
    const events = metrics?.recentActivity ?? [];

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <span className="mono" style={{ fontSize: 9, color: "var(--mute-2)" }}>
                    recent activity
                </span>
                <span className="mono" style={{ fontSize: 9, color: "var(--mute-3)" }}>
                    last 48h
                </span>
            </div>

            {events.length === 0 ? (
                <p style={{ fontSize: "var(--text-xs)", color: "var(--mute-3)", lineHeight: 1.55 }}>
                    No activity in the last 48 hours.
                </p>
            ) : (
                <div className="flex flex-col gap-1.5">
                    {events.map((event, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <span style={{ fontSize: "var(--text-xs)", color: "var(--mute)" }}>{event.label}</span>
                            <span className="mono" style={{ fontSize: 9, color: "var(--mute-3)" }}>
                                {event.timeAgo}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
