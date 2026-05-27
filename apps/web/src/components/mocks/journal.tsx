const TABS = ["Log", "Wins", "Review prep", "Relevance"];

const ENTRIES = [
  {
    when: "today · 9:14",
    tag: "aria",
    agent: true,
    body: "You've mentioned feeling under-challenged three times in the last six weeks. That's a pattern worth looking at, not panicking about.",
  },
  {
    when: "yesterday",
    tag: "win",
    agent: false,
    body: "Shipped the payouts retry queue — first design fully owned end-to-end. Director acknowledged in standup.",
  },
  {
    when: "mon · 14:20",
    tag: "feedback",
    agent: false,
    body: "Manager noted that I 'drive clarity' in technical discussions. Filed under EM-relevant signal.",
  },
  {
    when: "last wk",
    tag: "aria",
    agent: true,
    body: "Your current role hasn't touched cross-functional planning in four months — that's the #1 gap for your next move.",
  },
];

const TAG_STYLES: Record<string, { bg: string; color: string }> = {
  aria:     { bg: "oklch(0.42 0.04 160 / 0.12)", color: "oklch(0.42 0.04 160)" },
  win:      { bg: "oklch(0.52 0.08 145 / 0.12)", color: "oklch(0.52 0.08 145)" },
  feedback: { bg: "oklch(0.6 0.1 60 / 0.12)",   color: "oklch(0.6 0.1 60)"    },
};

// Generate a simple sentiment polyline
const POINTS = [12, 30, 28, 42, 40, 55, 48, 30, 28, 18, 22, 35, 40];
const SW = 480, SH = 60, PAD = 6;
const PTS = POINTS.map((p, i) => {
  const x = PAD + (i / (POINTS.length - 1)) * (SW - PAD * 2);
  const y = PAD + (1 - p / 60) * (SH - PAD * 2);
  return [x, y] as [number, number];
});
const PATH = "M " + PTS.map((p) => p.join(",")).join(" L ");

export default function JournalMock() {
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
            kursa.app / journal
          </span>
        </div>
        <span className="chip">
          <span className="dot" />
          employed · stripe · 84 days
        </span>
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-0 px-4"
        style={{ borderBottom: "1px solid var(--line)", background: "var(--bg)" }}
      >
        {TABS.map((t, i) => (
          <span
            key={t}
            className="mono"
            style={{
              fontSize: 10.5,
              padding: "8px 12px",
              color: i === 0 ? "var(--ink)" : "var(--mute)",
              borderBottom: i === 0 ? "1.5px solid var(--ink)" : "none",
              cursor: "default",
            }}
          >
            {t}
          </span>
        ))}
      </div>

      {/* Entries */}
      <div className="flex flex-col">
        {ENTRIES.map((e, i) => (
          <div
            key={i}
            className="flex gap-3 px-4 py-3"
            style={{
              borderBottom:
                i < ENTRIES.length - 1 ? "1px solid var(--line)" : "none",
              background: e.agent ? "var(--bg)" : "var(--surface)",
            }}
          >
            <div
              className="mono flex-shrink-0 text-right"
              style={{ fontSize: 9.5, color: "var(--mute-3)", minWidth: 60, paddingTop: 1 }}
            >
              {e.when}
            </div>
            <div className="flex items-start gap-2">
              <span
                className="mono rounded px-1.5 py-0.5 flex-shrink-0"
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  ...(TAG_STYLES[e.tag] ?? { bg: "var(--bg-sub)", color: "var(--mute)" }),
                  background: (TAG_STYLES[e.tag] ?? TAG_STYLES.aria).bg,
                  color: (TAG_STYLES[e.tag] ?? TAG_STYLES.aria).color,
                }}
              >
                {e.tag}
              </span>
              <p style={{ fontSize: 11, color: "var(--mute)", lineHeight: 1.5 }}>{e.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sentiment chart */}
      <div
        className="px-4 pt-3 pb-4"
        style={{ borderTop: "1px solid var(--line)", background: "var(--bg)" }}
      >
        <div
          className="mono flex items-center justify-between mb-2"
          style={{ fontSize: 9.5, color: "var(--mute)" }}
        >
          <span>engagement · last 12 weeks</span>
          <span style={{ color: "oklch(0.42 0.04 160)" }}>quiet uptick</span>
        </div>
        <svg
          viewBox={`0 0 ${SW} ${SH}`}
          preserveAspectRatio="none"
          style={{ width: "100%", height: 40, display: "block" }}
        >
          <path
            d={PATH}
            fill="none"
            stroke="oklch(0.42 0.04 160)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          {PTS.map((p, i) => (
            <circle
              key={i}
              cx={p[0]}
              cy={p[1]}
              r="2"
              fill="oklch(0.42 0.04 160)"
            />
          ))}
          <line
            x1={PAD}
            y1={SH - PAD}
            x2={SW - PAD}
            y2={SH - PAD}
            stroke="var(--line)"
            strokeWidth="0.7"
          />
        </svg>
      </div>
    </div>
  );
}
