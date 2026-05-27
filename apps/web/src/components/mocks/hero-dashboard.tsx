const PULSE_COLS = [
  { label: "growth",      pattern: [0,1,1,2,1,2,2,2,1,2,2,2], accent: [10,11] },
  { label: "visibility",  pattern: [1,0,1,1,1,2,1,1,2,1,2,1], accent: []      },
  { label: "progression", pattern: [0,0,0,1,1,1,1,1,1,2,2,2], accent: [10,11] },
];
const HEIGHTS = [3, 8, 14]; // px per level 0/1/2

const OBSERVATIONS = [
  {
    body: "Your Python work has slowed to a trickle over the past four months. You said staying sharp here mattered — want to scope a weekend project?",
    meta: "noticed · 2h ago",
  },
  {
    body: "A staff role just opened at Linear — on your target list since March. Strategic fit reads high. Worth a look before applications close.",
    meta: "surfaced · 18m ago",
  },
];

export default function HeroDashboardMock() {
  return (
    <div
      className="rounded-xl overflow-hidden shadow-sm"
      style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
    >
      {/* Window chrome */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: "1px solid var(--line)", background: "var(--bg-sub)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            {["#F5A0A0", "#F5D0A0", "#A0D0A0"].map((c, i) => (
              <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
            ))}
          </div>
          <span className="mono" style={{ fontSize: 10, color: "var(--mute-2)" }}>
            kursa.app / home
          </span>
        </div>
        <span className="chip live">
          <span className="dot" />
          aria · online
        </span>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-5">
        {/* Greeting */}
        <div>
          <div className="eyebrow mono mb-1" style={{ fontSize: 10 }}>
            tuesday · 7:42 am
          </div>
          <h3
            className="font-semibold text-[var(--ink)] mb-1.5 tracking-tight"
            style={{ fontSize: "var(--text-md)" }}
          >
            Good morning, Alex.
          </h3>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--mute)", lineHeight: 1.55 }}>
            You're three weeks into the new role at Stripe. Things look steady — two items worth
            your attention below.
          </p>
        </div>

        {/* Observations */}
        <div className="flex flex-col gap-3">
          {OBSERVATIONS.map((o, i) => (
            <div key={i} className="flex gap-2.5">
              <span
                className="mt-1.5 flex-shrink-0 rounded-full"
                style={{ width: 5, height: 5, background: "var(--accent)" }}
              />
              <div>
                <p style={{ fontSize: 11, color: "var(--mute)", lineHeight: 1.55 }}>{o.body}</p>
                <div className="mono mt-1" style={{ fontSize: 9.5, color: "var(--mute-3)" }}>
                  {o.meta}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pulse bars */}
        <div className="flex gap-4">
          {PULSE_COLS.map((col) => (
            <div key={col.label} className="flex-1">
              <div className="mono mb-1.5" style={{ fontSize: 9, color: "var(--mute-2)" }}>
                {col.label}
              </div>
              <div className="flex items-end gap-px" style={{ height: 18 }}>
                {col.pattern.map((v, i) => (
                  <i
                    key={i}
                    className="not-italic flex-1 rounded-[1px] transition-none"
                    style={{
                      height: HEIGHTS[v],
                      background: col.accent.includes(i)
                        ? "oklch(0.42 0.04 160)"
                        : v > 0
                          ? "var(--line-2)"
                          : "var(--line)",
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Input bar */}
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ border: "1px solid var(--line)", background: "var(--bg)" }}
        >
          <span style={{ color: "var(--accent)", fontSize: 13 }}>›</span>
          <span className="flex-1" style={{ fontSize: 11.5, color: "var(--mute-3)" }}>
            Ask Aria anything…
          </span>
          <span className="kbd" style={{ fontSize: 9.5 }}>
            ⌘ K
          </span>
        </div>
      </div>
    </div>
  );
}
