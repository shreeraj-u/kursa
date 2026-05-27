const VERSIONS = [
  { label: "alex_morgan · em_track_v6.pdf", active: true  },
  { label: "staff_eng_v4.pdf",              active: false },
  { label: "linear_em_v1.pdf",              active: false },
  { label: "stripe_apply_v2.pdf",           active: false },
];

const COVERAGE = [
  { label: "Stripe — payouts ledger", tag: "on-path",  in: true  },
  { label: "Hiring loop · 22 ints",   tag: "EM signal", in: true  },
  { label: "Mentorship · 2 ICs",      tag: "EM signal", in: true  },
  { label: "Kubernetes deep-dives",   tag: "off-path",  in: false },
  { label: "Side project · clipsy",   tag: "unrelated", in: false },
];

export default function ResumeMock() {
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
            kursa.app / resume
          </span>
        </div>
        <span className="chip live">
          <span className="dot" />
          tailoring · reading JD
        </span>
      </div>

      {/* Version bar */}
      <div
        className="flex items-center gap-3 px-4 py-2 overflow-x-auto"
        style={{ borderBottom: "1px solid var(--line)", background: "var(--bg)" }}
      >
        {VERSIONS.map((v) => (
          <span
            key={v.label}
            className="mono whitespace-nowrap"
            style={{
              fontSize: 9.5,
              color: v.active ? "var(--ink)" : "var(--mute-3)",
              fontWeight: v.active ? 600 : 400,
              paddingBottom: v.active ? 2 : 0,
              borderBottom: v.active ? "1px solid var(--ink)" : "none",
            }}
          >
            {v.label}
          </span>
        ))}
        <span
          className="ml-auto mono whitespace-nowrap flex-shrink-0"
          style={{ fontSize: 9.5, color: "var(--mute-3)" }}
        >
          4 versions
        </span>
      </div>

      {/* Two-col body */}
      <div className="grid grid-cols-[3fr_2fr] divide-x divide-[var(--line)]">
        {/* Document preview */}
        <div className="p-4">
          <div
            className="font-semibold text-[var(--ink)] mb-0.5 tracking-tight"
            style={{ fontSize: "var(--text-md)" }}
          >
            Alex Morgan
          </div>
          <div
            className="mono flex gap-2 mb-3 flex-wrap"
            style={{ fontSize: 9.5, color: "var(--mute)" }}
          >
            <span>alex@morgan.dev</span>
            <span>sf · ca</span>
            <span>github.com/amorgan</span>
          </div>
          <hr style={{ borderColor: "var(--line)", marginBottom: 10 }} />

          <div
            className="mono uppercase tracking-widest mb-2"
            style={{ fontSize: 8.5, color: "var(--mute)" }}
          >
            experience
          </div>

          {/* Stripe role */}
          <div className="flex items-baseline justify-between mb-1">
            <span
              className="font-medium text-[var(--ink)]"
              style={{ fontSize: 10.5 }}
            >
              Senior Software Engineer · Stripe
            </span>
            <span className="mono" style={{ fontSize: 9, color: "var(--mute)" }}>
              2024 – present
            </span>
          </div>
          <ul className="ml-3 mb-3 flex flex-col gap-1">
            <li
              className="rounded px-1.5 py-0.5"
              style={{
                fontSize: 10,
                lineHeight: 1.45,
                background: "var(--diff-add)",
                color: "var(--diff-add-ink)",
              }}
            >
              Led a four-engineer effort to rebuild the payouts ledger, cutting reconciliation lag
              from 11h to under 20m.
            </li>
            <li
              className="rounded px-1.5 py-0.5"
              style={{
                fontSize: 10,
                lineHeight: 1.45,
                background: "var(--diff-del)",
                color: "var(--diff-del-ink)",
                textDecoration: "line-through",
              }}
            >
              Worked on the payouts team and helped improve reconciliation.
            </li>
            <li style={{ fontSize: 10, color: "var(--mute)", lineHeight: 1.45, paddingLeft: 6 }}>
              Mentored two junior engineers through their first production launches.
            </li>
            <li
              className="rounded px-1.5 py-0.5"
              style={{
                fontSize: 10,
                lineHeight: 1.45,
                background: "var(--diff-add)",
                color: "var(--diff-add-ink)",
              }}
            >
              Ran the quarterly hiring loop — interviewed 22 candidates, made 4 hires now
              performing at-bar.
            </li>
          </ul>

          {/* Datadog role */}
          <div className="flex items-baseline justify-between mb-1">
            <span className="font-medium text-[var(--ink)]" style={{ fontSize: 10.5 }}>
              Software Engineer · Datadog
            </span>
            <span className="mono" style={{ fontSize: 9, color: "var(--mute)" }}>
              2021 – 2024
            </span>
          </div>
          <ul className="ml-3 flex flex-col gap-1">
            <li style={{ fontSize: 10, color: "var(--mute)", lineHeight: 1.45, paddingLeft: 6 }}>
              Shipped the metrics intake rewrite, sustaining 2.3M req/s at p99 of 41ms.
            </li>
            <li style={{ fontSize: 10, color: "var(--mute)", lineHeight: 1.45, paddingLeft: 6 }}>
              Owned the on-call rotation for the ingestion pod through three major outages.
            </li>
          </ul>
        </div>

        {/* Sidebar: ATS + Coverage + Tailoring */}
        <div className="p-4 flex flex-col gap-4">
          {/* ATS */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: 38,
                height: 38,
                border: "2px solid oklch(0.42 0.04 160)",
                color: "oklch(0.42 0.04 160)",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              88
            </div>
            <div>
              <div
                className="font-medium text-[var(--ink)]"
                style={{ fontSize: 11 }}
              >
                ATS readable · strong
              </div>
              <div style={{ fontSize: 10, color: "var(--mute)", lineHeight: 1.4, marginTop: 2 }}>
                Two suggestions left. Both about phrasing, not structure.
              </div>
            </div>
          </div>

          {/* Coverage */}
          <div>
            <div
              className="font-medium text-[var(--ink)] mb-2"
              style={{ fontSize: 11 }}
            >
              profile coverage
            </div>
            <div className="flex flex-col gap-1.5">
              {COVERAGE.map((c) => (
                <div key={c.label} className="flex items-center gap-2">
                  <span
                    className="flex-shrink-0 rounded-full"
                    style={{
                      width: 5,
                      height: 5,
                      background: c.in ? "oklch(0.52 0.08 145)" : "var(--line-3)",
                    }}
                  />
                  <span
                    className="flex-1"
                    style={{ fontSize: 10, color: c.in ? "var(--ink)" : "var(--mute-2)" }}
                  >
                    {c.label}
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: 9,
                      color: c.in ? "oklch(0.42 0.04 160)" : "var(--mute-3)",
                    }}
                  >
                    {c.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tailoring */}
          <div
            className="rounded-lg p-3"
            style={{ border: "1px solid var(--line)", background: "var(--bg)" }}
          >
            <div
              className="mono flex items-center justify-between mb-2"
              style={{ fontSize: 9.5, color: "var(--mute)" }}
            >
              <span>tailoring</span>
              <span style={{ color: "oklch(0.42 0.04 160)" }}>auto · live</span>
            </div>
            <div className="flex items-center gap-1.5 mb-2">
              <span
                className="rounded-full flex-shrink-0"
                style={{ width: 5, height: 5, background: "oklch(0.42 0.04 160)" }}
              />
              <span style={{ fontSize: 10, color: "var(--mute)" }}>Reading job description…</span>
              <span className="mono" style={{ fontSize: 9, color: "var(--mute-3)" }}>
                linear.app/careers
              </span>
            </div>
            <div style={{ fontSize: 10, color: "var(--mute)", lineHeight: 1.5 }}>
              Two bullets re-ranked. One impact phrase shortened to fit the role's emphasis on{" "}
              <strong style={{ color: "var(--ink)" }}>scope ownership</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
