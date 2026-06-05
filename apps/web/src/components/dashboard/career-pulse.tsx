import type { DashboardMetrics } from "@/types/profile";

interface CareerPulseProps {
    metrics: DashboardMetrics | null;
}

export default function CareerPulse({ metrics }: CareerPulseProps) {
    if (!metrics) {
        return (
            <p className="text-xs text-mute-3">
                Build your profile to start tracking career signals.
            </p>
        );
    }

    const cols = [
        { label: "growth", ...metrics.pulse.growth },
        { label: "visibility", ...metrics.pulse.visibility },
        { label: "progression", ...metrics.pulse.progression },
    ];

    const trendClass = (trend: string) => {
        if (trend === "rising" || trend === "strong" || trend === "on track") return "text-accent";
        if (trend === "building" || trend === "steady" || trend === "in progress") return "text-mute-2";
        return "text-mute-3";
    };

    return (
        <div className="flex gap-5 max-md:flex-col">
            {cols.map((col) => (
                <div key={col.label} className="flex-1 rounded-md border border-line bg-bg-sub/60 p-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="mono text-2xs text-mute-2">
                            {col.label}
                        </span>
                        <span className={`mono text-2xs ${trendClass(col.trend)}`}>
                            {col.trend}
                        </span>
                    </div>
                    <div className="flex items-end gap-px" style={{ height: 18 }}>
                        {col.pattern.map((v, i) => (
                            <i
                                key={i}
                                className="not-italic flex-1 rounded-[1px]"
                                style={{
                                    height: Math.max(2, v * 9),
                                    background:
                                        i >= 10 && v > 0
                                            ? "var(--accent)"
                                            : v > 0
                                                ? "var(--line-2)"
                                                : "var(--line)",
                                }}
                            />
                        ))}
                    </div>
                    <p className="text-xs text-mute leading-normal mt-1.5">
                        {col.observation}
                    </p>
                </div>
            ))}
        </div>
    );
}
