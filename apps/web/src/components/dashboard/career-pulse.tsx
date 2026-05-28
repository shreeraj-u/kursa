import type { DashboardMetrics } from "@/types/profile";

interface CareerPulseProps {
    metrics: DashboardMetrics | null;
}

// TODO: Make this dynamic with AI 
const HEIGHTS = [3, 8, 14];

export default function CareerPulse({ metrics }: CareerPulseProps) {
    if (!metrics) {
        return (
            <p style={{ fontSize: "var(--text-xs)", color: "var(--mute-3)" }}>
                Build your profile to start tracking career signals.
            </p>
        );
    }

    const cols = [
        { label: "growth", ...metrics.pulse.growth },
        { label: "visibility", ...metrics.pulse.visibility },
        { label: "progression", ...metrics.pulse.progression },
    ];

    const trendColor = (trend: string) => {
        if (trend === "rising" || trend === "strong" || trend === "on track") return "var(--accent)";
        if (trend === "building" || trend === "steady" || trend === "in progress") return "var(--mute-2)";
        return "var(--mute-3)";
    };

    return (
        <div className="flex gap-5">
            {cols.map((col) => (
                <div key={col.label} className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className="mono" style={{ fontSize: 9, color: "var(--mute-2)" }}>
                            {col.label}
                        </span>
                        <span className="mono" style={{ fontSize: 9, color: trendColor(col.trend) }}>
                            {col.trend}
                        </span>
                    </div>
                    <div className="flex items-end gap-px" style={{ height: 18 }}>
                        {col.pattern.map((v, i) => (
                            <i
                                key={i}
                                className="not-italic flex-1 rounded-[1px]"
                                style={{
                                    height: HEIGHTS[v],
                                    background:
                                        i >= 10 && v > 0
                                            ? "oklch(0.42 0.04 160)"
                                            : v > 0
                                                ? "var(--line-2)"
                                                : "var(--line)",
                                }}
                            />
                        ))}
                    </div>
                    <p
                        style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--mute)",
                            lineHeight: 1.5,
                            marginTop: 6,
                        }}
                    >
                        {col.observation}
                    </p>
                </div>
            ))}
        </div>
    );
}
