const PATH = [
  { label: "Profile memory", detail: "skills, wins, goals", active: true },
  { label: "Career journey", detail: "manager track", active: true },
  { label: "Next action", detail: "review story", active: false },
];

const SIGNALS = [
  "people leadership proof",
  "roadmap ownership",
  "Python going dormant",
];

export default function HeroDashboardMock() {
  return (
    <div
      className="overflow-hidden rounded-xl shadow-sm"
      style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
    >
      <div
        className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5"
        style={{ borderBottom: "1px solid var(--line)", background: "var(--bg-sub)" }}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex gap-1.5">
            {["#F5A0A0", "#F5D0A0", "#A0D0A0"].map((color) => (
              <span key={color} className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
            ))}
          </div>
          <span className="mono truncate" style={{ fontSize: 11, color: "var(--mute-2)" }}>
            kursa.app / advisor
          </span>
        </div>
        <span className="chip live hidden sm:inline-flex">
          <span className="dot" />
          aria online
        </span>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between gap-8 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-5 sm:p-6">
          <div>
            <div className="eyebrow mono mb-3" style={{ fontSize: 10 }}>
              daily suggestions
            </div>
            <h3
              className="max-w-xl font-semibold leading-tight text-[var(--ink)]"
              style={{ fontSize: "clamp(1.45rem, 3vw, 2rem)" }}
            >
              You are closer to management than your resume currently shows.
            </h3>
            <p className="mt-3 max-w-lg leading-relaxed text-[var(--mute)]" style={{ fontSize: 14 }}>
              Kursa connects the work you capture, the skills you are building, and the path you
              want next. Then it turns that context into specific moves.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {PATH.map((step, index) => (
              <div
                key={step.label}
                className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3"
              >
                <div
                  className="mb-3 flex h-7 w-7 items-center justify-center rounded-full"
                  style={{
                    background: step.active ? "var(--accent)" : "var(--line-2)",
                    color: step.active ? "var(--surface)" : "var(--mute)",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {index + 1}
                </div>
                <div className="font-medium leading-snug text-[var(--ink)]" style={{ fontSize: 13 }}>
                  {step.label}
                </div>
                <div className="mono mt-1 text-[var(--mute-2)]" style={{ fontSize: 10 }}>
                  {step.detail}
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="flex flex-col gap-5">
          <section className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="eyebrow mono" style={{ fontSize: 10 }}>
                career journey
              </div>
              <span className="mono text-[var(--accent)]" style={{ fontSize: 10 }}>
                84% confidence
              </span>
            </div>
            <div className="space-y-3">
              {["Tech lead scope", "People leadership", "Manager transition"].map((item, index) => (
                <div key={item} className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ background: index < 2 ? "var(--accent)" : "var(--line-3)" }}
                  />
                  <span className="flex-1 text-[var(--ink)]" style={{ fontSize: 13 }}>
                    {item}
                  </span>
                  <span className="mono text-[var(--mute-2)]" style={{ fontSize: 10 }}>
                    +{index * 6 + 3} mo
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
            <div className="eyebrow mono mb-3" style={{ fontSize: 10 }}>
              signals
            </div>
            <div className="flex flex-wrap gap-2">
              {SIGNALS.map((signal) => (
                <span
                  key={signal}
                  className="rounded-md border border-[var(--line)] bg-[var(--bg-sub)] px-2.5 py-1.5 text-[var(--mute)]"
                  style={{ fontSize: 12 }}
                >
                  {signal}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[var(--accent-line)] bg-[var(--surface)] p-5">
            <div className="eyebrow mono mb-2" style={{ fontSize: 10 }}>
              next move
            </div>
            <p className="leading-relaxed text-[var(--ink-2)]" style={{ fontSize: 14 }}>
              Draft a review story around mentorship, scope, and roadmap ownership.
            </p>
            <div className="mt-4 flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5">
              <span className="text-[var(--mute)]" style={{ fontSize: 12 }}>
                Ask Aria
              </span>
              <span className="kbd">cmd k</span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
