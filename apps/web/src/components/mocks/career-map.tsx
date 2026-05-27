const NOW = { x: 11, y: 52 };

const NODES = [
  { x: 30, y: 30, label: "Tech lead",   yr: "+0.7y", chosen: true  },
  { x: 50, y: 22, label: "Eng manager", yr: "+1.8y", chosen: true  },
  { x: 74, y: 18, label: "Director",    yr: "+3.5y", chosen: true  },
  { x: 35, y: 54, label: "Senior eng",  yr: "+1y",   chosen: false },
  { x: 62, y: 48, label: "Staff eng",   yr: "+2.5y", chosen: false },
  { x: 88, y: 42, label: "Principal",   yr: "+5y",   chosen: false },
  { x: 38, y: 74, label: "PM rotation", yr: "+1.2y", chosen: false },
  { x: 68, y: 78, label: "Senior PM",   yr: "+3y",   chosen: false },
  { x: 42, y: 90, label: "Independent", yr: "+2y",   chosen: false },
];

const EDGES = [
  { from: NOW,      to: NODES[0], chosen: true  },
  { from: NODES[0], to: NODES[1], chosen: true  },
  { from: NODES[1], to: NODES[2], chosen: true  },
  { from: NOW,      to: NODES[3], chosen: false },
  { from: NODES[3], to: NODES[4], chosen: false },
  { from: NODES[4], to: NODES[5], chosen: false },
  { from: NOW,      to: NODES[6], chosen: false },
  { from: NODES[6], to: NODES[7], chosen: false },
  { from: NOW,      to: NODES[8], chosen: false },
];

const ACCENT = "oklch(0.42 0.04 160)";

function MockChrome({ path, right }: { path: string; right: React.ReactNode }) {
  return (
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
          {path}
        </span>
      </div>
      {right}
    </div>
  );
}

export default function CareerMapMock() {
  return (
    <div
      className="rounded-xl overflow-hidden shadow-sm"
      style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
    >
      <MockChrome
        path="kursa.app / path"
        right={
          <div className="flex items-center gap-2">
            <span className="chip">
              <span className="dot" style={{ background: ACCENT }} />
              chosen · eng manager
            </span>
            <span className="chip">+ alt 4</span>
          </div>
        }
      />

      {/* Canvas */}
      <div className="relative" style={{ height: 220, overflow: "hidden" }}>
        {/* SVG edges */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {EDGES.map((e, i) => (
            <line
              key={i}
              x1={e.from.x} y1={e.from.y}
              x2={e.to.x}   y2={e.to.y}
              stroke={e.chosen ? ACCENT : "#C9C6BD"}
              strokeWidth={e.chosen ? "0.35" : "0.2"}
              strokeDasharray={e.chosen ? "" : "1 0.8"}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {/* "You are here" node */}
        <div
          className="absolute flex items-center gap-1"
          style={{ left: `${NOW.x}%`, top: `${NOW.y}%`, transform: "translate(-50%,-50%)" }}
        >
          <span
            className="rounded-full flex-shrink-0"
            style={{ width: 7, height: 7, background: ACCENT }}
          />
          <span className="mono whitespace-nowrap" style={{ fontSize: 9, color: "var(--ink)" }}>
            you are here
          </span>
          <span className="mono whitespace-nowrap" style={{ fontSize: 8, color: "var(--mute-2)" }}>
            2026
          </span>
        </div>

        {/* Path nodes */}
        {NODES.map((n, i) => (
          <div
            key={i}
            className="absolute flex items-center gap-1"
            style={{ left: `${n.x}%`, top: `${n.y}%`, transform: "translate(-50%,-50%)" }}
          >
            <span
              className="rounded-full flex-shrink-0"
              style={{
                width: 5,
                height: 5,
                background: n.chosen ? ACCENT : "var(--line-3)",
              }}
            />
            <span
              className="mono whitespace-nowrap"
              style={{ fontSize: 8.5, color: n.chosen ? "var(--ink)" : "var(--mute-2)" }}
            >
              {n.label}
            </span>
            <span
              className="mono whitespace-nowrap"
              style={{ fontSize: 8, color: "var(--mute-3)" }}
            >
              {n.yr}
            </span>
          </div>
        ))}
      </div>

      {/* Axis */}
      <div
        className="flex items-center justify-between px-5 py-2"
        style={{ borderTop: "1px solid var(--line)", background: "var(--bg)" }}
      >
        {["now", "+1 yr", "+2 yr", "+3 yr", "+5 yr"].map((t) => (
          <span key={t} className="mono" style={{ fontSize: 9, color: "var(--mute-3)" }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
