"use client";

import type { ProactiveNudge } from "@kursa/types";

type Props = {
  nudges: ProactiveNudge[];
};

export function JournalProactiveNudges({ nudges }: Props) {
  if (nudges.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="mono" style={{ fontSize: 9, color: "var(--mute-2)" }}>
        aria suggests
      </div>
      {nudges.slice(0, 3).map((n) => (
        <div
          key={n.id}
          className="rounded px-2.5 py-2"
          style={{
            border: "1px solid var(--line)",
            background: n.priority === "high" ? "var(--accent-soft)" : "var(--bg-sub)",
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 500, color: "var(--ink)" }}>{n.title}</div>
          <p style={{ fontSize: 10, color: "var(--mute)", marginTop: 2, lineHeight: 1.4 }}>
            {n.message}
          </p>
        </div>
      ))}
    </div>
  );
}
