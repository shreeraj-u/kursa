"use client";

import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";

import type { TrendPoint } from "@/lib/dashboard/journal/journal-utils";
import { computeTrendLabel } from "@/lib/dashboard/journal/journal-utils";

type Props = {
  data: TrendPoint[];
  trendLabel?: string;
  height?: number;
  showLabel?: boolean;
  compact?: boolean;
  className?: string;
};

export function JournalEngagementChart({
  data,
  trendLabel: passedTrendLabel,
  height = 60,
  showLabel = true,
  compact = false,
  className,
}: Props) {
  const reduced = useReducedMotion();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const { path, dots, width, trendLabel: calculatedLabel } = useMemo(() => {
    const w = 480;
    const h = height;
    const pad = 8;
    const values = data.map((d) => d.value);
    const max = Math.max(...values, 0.01);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    const pts = values.map((v, i) => {
      const x = pad + (i / Math.max(values.length - 1, 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / range) * (h - pad * 2);
      return { x, y, value: v, label: data[i]?.weekLabel ?? "" };
    });

    const pathD =
      pts.length > 0
        ? `M ${pts.map((p) => `${p.x},${p.y}`).join(" L ")}`
        : "";

    return {
      path: pathD,
      dots: pts,
      width: w,
      trendLabel: computeTrendLabel(data),
    };
  }, [data, height]);

  const trendLabel = passedTrendLabel ?? calculatedLabel;

  if (data.length === 0) {
    return (
      <p className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--mute-2)" }}>
        Log weekly check-ins to see your trend.
      </p>
    );
  }

  return (
    <div className={className}>
      {showLabel && !compact && (
        <div className="flex items-baseline justify-between mb-2">
          <span className="mono" style={{ fontSize: 9, color: "var(--mute-2)" }}>
            engagement · last 12 weeks
          </span>
          <span className="mono" style={{ fontSize: 9, color: "var(--accent)" }}>
            {trendLabel}
          </span>
        </div>
      )}
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          style={{ height }}
          preserveAspectRatio="none"
          onMouseLeave={() => setHoverIdx(null)}
        >
          <motion.path
            d={path}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduced ? false : { pathLength: 0, opacity: 0.4 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
          {dots.map((pt, i) => (
            <circle
              key={`${pt.label}-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={hoverIdx === i ? 4 : 2.5}
              fill={hoverIdx === i ? "var(--accent)" : "var(--surface)"}
              stroke="var(--accent)"
              strokeWidth={1.5}
              style={{ cursor: "pointer", transition: "r 0.15s" }}
              onMouseEnter={() => setHoverIdx(i)}
            />
          ))}
        </svg>
        {hoverIdx !== null && dots[hoverIdx] && (
          <div
            className="absolute pointer-events-none rounded px-2 py-1 mono"
            style={{
              fontSize: 9,
              background: "var(--bg-sub-2)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
              top: 0,
              left: `${(dots[hoverIdx].x / width) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            {dots[hoverIdx].label} · {Math.round(dots[hoverIdx].value * 100)}%
          </div>
        )}
      </div>
    </div>
  );
}
