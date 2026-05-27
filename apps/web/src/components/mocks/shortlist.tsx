const ROLES = [
  {
    co: "Linear", letter: "L",
    title: "Engineering Manager, Core",
    reason: "On the line you've been walking — a real first EM seat at a product-led company you already admire.",
    cur: 74, strat: 92,
  },
  {
    co: "Vercel", letter: "V",
    title: "Staff Engineer, Build Platform",
    reason: "Stepping stone. Closes the systems-design gap without leaving the IC track yet.",
    cur: 82, strat: 71,
  },
  {
    co: "Ramp", letter: "R",
    title: "Engineering Manager, Money Movement",
    reason: "Direct analog to your Stripe ledger work — the easiest story to tell in an EM loop.",
    cur: 79, strat: 88,
  },
  {
    co: "Render", letter: "r",
    title: "Senior Tech Lead, Infra",
    reason: "Tech-lead role that often promotes to EM within a year. Aligned with your stated timeline.",
    cur: 86, strat: 78,
  },
];

export default function ShortlistMock() {
  return (
    <div
      className="rounded-xl overflow-hidden shadow-sm"
      style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
    >
      {/* Chrome */}
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
            kursa.app / shortlist
          </span>
        </div>
        <span className="chip">
          <span className="dot" />
          12 curated · 0 noise
        </span>
      </div>

      {/* Filter bar */}
      <div
        className="px-4 py-2.5 flex items-center gap-1.5 flex-wrap"
        style={{ borderBottom: "1px solid var(--line)", background: "var(--bg)", fontSize: 11.5, color: "var(--mute)" }}
      >
        <span>show me</span>
        <span
          className="rounded px-1.5 py-0.5 font-medium"
          style={{
            background: "var(--bg-sub-2)",
            color: "var(--ink)",
            border: "1px solid var(--line-2)",
            fontSize: 11,
          }}
        >
          stepping-stone roles
        </span>
        <span>that match my</span>
        <span
          className="rounded px-1.5 py-0.5 font-medium"
          style={{
            background: "var(--bg-sub-2)",
            color: "var(--ink)",
            border: "1px solid var(--line-2)",
            fontSize: 11,
          }}
        >
          eng manager track
        </span>
      </div>

      {/* Role list */}
      <div>
        {ROLES.map((r, i) => (
          <div
            key={i}
            className="flex items-start gap-3 px-4 py-4"
            style={{
              borderBottom: i < ROLES.length - 1 ? "1px solid var(--line)" : "none",
            }}
          >
            {/* Company logo placeholder */}
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-md font-semibold"
              style={{
                width: 28,
                height: 28,
                background: "var(--bg-sub)",
                border: "1px solid var(--line)",
                fontSize: 12,
                color: "var(--ink)",
                fontStyle: i === 3 ? "italic" : "normal",
              }}
            >
              {r.letter}
            </div>

            {/* Meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2 mb-0.5">
                <span
                  className="font-medium text-[var(--ink)] truncate"
                  style={{ fontSize: 11.5 }}
                >
                  {r.title}
                </span>
                <span
                  className="mono flex-shrink-0"
                  style={{ fontSize: 10, color: "var(--mute)" }}
                >
                  {r.co}
                </span>
              </div>
              <p style={{ fontSize: 10.5, color: "var(--mute)", lineHeight: 1.45 }}>{r.reason}</p>
            </div>

            {/* Fit scores */}
            <div className="flex-shrink-0 flex flex-col gap-1.5" style={{ minWidth: 80 }}>
              {[
                { label: "current",  val: r.cur,   accent: false },
                { label: "strategic", val: r.strat, accent: true  },
              ].map((fit) => (
                <div key={fit.label} className="flex items-center gap-1.5">
                  <span
                    className="mono"
                    style={{ fontSize: 9, color: "var(--mute-2)", width: 46 }}
                  >
                    {fit.label}
                  </span>
                  <div
                    className="rounded-full overflow-hidden"
                    style={{ width: 36, height: 3, background: "var(--line)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${fit.val}%`,
                        background: fit.accent ? "oklch(0.42 0.04 160)" : "var(--ink-3)",
                      }}
                    />
                  </div>
                  <span
                    className="mono font-semibold"
                    style={{
                      fontSize: 9,
                      color: fit.accent ? "oklch(0.42 0.04 160)" : "var(--ink-3)",
                    }}
                  >
                    {fit.val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
