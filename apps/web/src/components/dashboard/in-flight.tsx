import Link from "next/link";
import type { DashboardMetrics } from "@/types/profile";

interface InFlightProps {
    metrics: DashboardMetrics | null;
}

const STAGE_COUNT = 5;

const getStageClass = (stage: string) => {
    switch (stage) {
        case "phone_screen":
            return "chip";
        case "on_site":
        case "technical":
            return "chip good";
        case "offer":
            return "rounded px-1.5 py-0.5 bg-accent text-white text-3xs font-mono font-medium";
        case "closed":
        case "passed":
            return "text-3xs text-mute-3 font-mono";
        case "shortlisted":
        case "draft":
            return "chip warn";
        default:
            return "text-3xs text-mute-2 font-mono";
    }
};

export default function InFlight({ metrics }: InFlightProps) {
    const applications = metrics?.inFlight.applications ?? [];
    const activeCount = metrics?.inFlight.activeCount ?? 0;
    const closedCount = metrics?.inFlight.closedCount ?? 0;

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <span className="mono text-2xs text-mute-2">
                    in flight · applications
                </span>
                <div className="flex items-center gap-2">
                    <span className="mono text-2xs text-mute-3">
                        {activeCount} active · {closedCount} closed
                    </span>
                    <Link href="/dashboard/applications" className="mono text-2xs text-mute-3 hover:text-ink transition-colors">
                        →
                    </Link>
                </div>
            </div>

            {applications.length === 0 ? (
                <div className="py-6 text-center">
                    <p className="text-xs text-mute-3 leading-relaxed">
                        No active applications. Add roles from the shortlist to track them here.
                    </p>
                </div>
            ) : (
                <div>
                    {applications.map((app) => (
                        <div
                            key={app.id}
                            className="flex items-start gap-2.5 py-2 border-t border-line"
                        >
                            {/* Company initial circle */}
                            <div className="flex items-center justify-center rounded-md flex-shrink-0 mono font-semibold w-6 h-6 bg-bg-sub-2 border border-line-2 text-2xs text-mute">
                                {app.company[0].toUpperCase()}
                            </div>

                            {/* Role info */}
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-ink font-medium">
                                    {app.roleTitle}
                                </div>
                                <div className="mono text-2xs text-mute-2">
                                    {app.company}
                                </div>
                            </div>

                            {/* Stage + date */}
                            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                <span className={getStageClass(app.stage)}>
                                    {app.stageLabel}
                                </span>
                                {app.stageIdx > 0 && (
                                    <span className="mono text-2xs text-mute-3">
                                        stage {app.stageIdx}/{STAGE_COUNT}
                                    </span>
                                )}
                                <span className="mono text-2xs text-mute-3">
                                    {app.formattedDate}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
