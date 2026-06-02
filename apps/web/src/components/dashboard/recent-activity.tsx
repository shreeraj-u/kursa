import Link from "next/link";
import type { DashboardMetrics } from "@/types/profile";

interface RecentActivityProps {
    metrics: DashboardMetrics | null;
}

export default function RecentActivity({ metrics }: RecentActivityProps) {
    const events = metrics?.recentActivity ?? [];

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <span className="mono text-2xs text-mute-2">
                    recent activity
                </span>
                <div className="flex items-center gap-2">
                    <span className="mono text-2xs text-mute-3">last 48h</span>
                    <Link href="/dashboard/journal" className="mono text-2xs text-mute-3 hover:text-ink transition-colors">
                        →
                    </Link>
                </div>
            </div>

            {events.length === 0 ? (
                <p className="text-xs text-mute-3 leading-relaxed">
                    No activity in the last 48 hours.
                </p>
            ) : (
                <div className="flex flex-col gap-1.5">
                    {events.map((event, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <span className="text-xs text-mute">{event.label}</span>
                            <span className="mono text-2xs text-mute-3">
                                {event.timeAgo}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
