const MESSAGES = [
  {
    role: "user" as const,
    body: "I just got an offer from Ramp. 240 base, big equity grant. Should I take it?",
    time: null,
  },
  {
    role: "aria" as const,
    body: "Given your two-year goal of stepping into engineering management, this is the cleanest setup I've seen for you. The team is small enough that tech-lead-to-EM is a real ladder, and your ledger work at Stripe maps directly to what they're solving. The base is on par with your current — the upside is in scope, not comp.",
    time: "14:02",
    footnote: "· evaluated against your stated priorities (mar 2025)\n· cross-checked with 4 EM transitions in your network",
  },
  {
    role: "aria" as const,
    body: "One thing I'd push back on — you haven't mentioned the people. The manager you'd report to is the variable that matters most. Want me to set up a question list before your closing call?",
    time: "14:03",
    footnote: null,
  },
];

const SUGGESTIONS = [
  "How am I tracking against my goals this month?",
  "Should I bring up a pay rise in my next review?",
  "Draft the questions for the closing call",
];

export default function AgentMock() {
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
            kursa.app / aria
          </span>
        </div>
        <span className="chip">
          <span className="dot" style={{ background: "oklch(0.42 0.04 160)" }} />
          thread · 142 days
        </span>
      </div>

      {/* Thread */}
      <div className="p-4 flex flex-col gap-3">
        {MESSAGES.map((msg, i) => (
          <div
            key={i}
            className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            {msg.role === "aria" && (
              <div className="flex flex-col gap-1 max-w-[90%]">
                <div
                  className="mono flex items-center gap-1.5 mb-0.5"
                  style={{ fontSize: 9.5, color: "var(--mute)" }}
                >
                  <span
                    className="rounded-full inline-block"
                    style={{
                      width: 14,
                      height: 14,
                      background: "oklch(0.42 0.04 160 / 0.15)",
                      border: "1px solid oklch(0.42 0.04 160 / 0.4)",
                    }}
                  />
                  aria · {msg.time}
                </div>
                <div
                  className="rounded-xl rounded-tl-sm px-3 py-2.5"
                  style={{
                    background: "var(--bg-sub)",
                    border: "1px solid var(--line)",
                    fontSize: 11.5,
                    color: "var(--ink)",
                    lineHeight: 1.55,
                  }}
                >
                  {msg.body}
                  {msg.footnote && (
                    <div
                      className="mono mt-2 pt-2"
                      style={{
                        borderTop: "1px solid var(--line)",
                        fontSize: 9.5,
                        color: "var(--mute)",
                        lineHeight: 1.6,
                        whiteSpace: "pre-line",
                      }}
                    >
                      {msg.footnote}
                    </div>
                  )}
                </div>
              </div>
            )}
            {msg.role === "user" && (
              <div
                className="rounded-xl rounded-tr-sm px-3 py-2.5 max-w-[80%]"
                style={{
                  background: "var(--ink)",
                  color: "var(--bg)",
                  fontSize: 11.5,
                  lineHeight: 1.5,
                }}
              >
                {msg.body}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Suggestions */}
      <div
        className="flex gap-2 flex-wrap px-4 pb-3"
        style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}
      >
        {SUGGESTIONS.map((s) => (
          <span
            key={s}
            className="rounded-full cursor-pointer transition-colors"
            style={{
              padding: "3px 10px",
              border: "1px solid var(--line-2)",
              background: "var(--bg)",
              fontSize: 10.5,
              color: "var(--mute)",
            }}
          >
            {s}
          </span>
        ))}
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-2 mx-4 mb-4 rounded-lg px-3 py-2"
        style={{ border: "1px solid var(--line)", background: "var(--bg)" }}
      >
        <span style={{ color: "var(--accent)", fontSize: 13 }}>›</span>
        <span className="flex-1" style={{ fontSize: 11.5, color: "var(--mute-3)" }}>
          Continue the thread…
        </span>
        <span
          className="mono"
          style={{ fontSize: 11, color: "var(--mute-2)" }}
        >
          ↵
        </span>
      </div>
    </div>
  );
}
