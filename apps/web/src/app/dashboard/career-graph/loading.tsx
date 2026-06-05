import { Skeleton } from "@kursa/ui/components/skeleton";

export default function CareerGraphLoading() {
  return (
    <div className="flex h-[calc(100svh-3rem)] flex-col">
      {/* Header bar — mirrors PageHeader */}
      <div
        className="flex items-center justify-between px-8"
        style={{ height: 44, borderBottom: "1px solid var(--line)" }}
      >
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-16 rounded bg-line-2" />
          <span style={{ color: "var(--mute-3)" }}>/</span>
          <Skeleton className="h-3 w-24 rounded bg-line" />
        </div>
        <Skeleton className="h-6 w-20 rounded bg-line-2" />
      </div>

      {/* Stat strip */}
      <div
        className="flex flex-wrap items-center gap-x-5 gap-y-2 px-8 py-2.5"
        style={{ borderBottom: "1px solid var(--line)" }}
      >
        {[28, 24, 30, 28, 32].map((w, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Skeleton className="h-4 rounded bg-line" style={{ width: w / 3 }} />
            <Skeleton className="h-3 rounded bg-line-2" style={{ width: w }} />
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          {[60, 40, 40, 48, 48].map((w, i) => (
            <Skeleton key={i} className="h-6 rounded bg-line-2" style={{ width: w }} />
          ))}
        </div>
      </div>

      {/* Canvas placeholder — faint scattered nodes + a settling hint */}
      <div className="relative min-h-0 flex-1 overflow-hidden" style={{ background: "var(--bg)" }}>
        <svg className="absolute inset-0 h-full w-full" aria-hidden>
          {/* Faint spine */}
          <line x1="12%" y1="50%" x2="85%" y2="50%" stroke="var(--line-2)" strokeWidth={2} strokeDasharray="6 6" />
          {[
            ["12%", "50%", 14],
            ["35%", "50%", 10],
            ["58%", "50%", 10],
            ["80%", "50%", 10],
            ["85%", "50%", 12],
            ["28%", "32%", 6],
            ["44%", "68%", 6],
            ["52%", "30%", 6],
            ["66%", "70%", 7],
            ["38%", "60%", 6],
            ["72%", "38%", 6],
          ].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="var(--line-2)" opacity={0.5} className="cg-skel" style={{ animationDelay: `${i * 90}ms` }} />
          ))}
        </svg>
        <div className="absolute bottom-3 left-3">
          <Skeleton className="h-24 w-48 rounded-md bg-line-2" />
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="mono text-2xs uppercase tracking-mono" style={{ color: "var(--mute-3)" }}>
            building your graph…
          </span>
        </div>
        <style>{`
          @keyframes cg-skel-pulse { 0%,100% { opacity: 0.25 } 50% { opacity: 0.6 } }
          .cg-skel { animation: cg-skel-pulse 1.4s ease-in-out infinite; }
        `}</style>
      </div>
    </div>
  );
}
