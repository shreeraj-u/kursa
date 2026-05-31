"use client";

type Memory = {
  id: string;
  category: string;
  fact: string;
  confidence: number;
  validFrom: string;
  learnedFromChat?: boolean;
};

type Props = {
  memories: Memory[];
  loading?: boolean;
};

export function JournalMemoriesPanel({ memories, loading }: Props) {
  if (loading) {
    return (
      <p className="mono" style={{ fontSize: 9, color: "var(--mute-2)" }}>
        Loading memories…
      </p>
    );
  }

  if (memories.length === 0) {
    return (
      <p style={{ fontSize: "var(--text-xs)", color: "var(--mute-2)" }}>
        Aria will distill facts as you log activity or chat on the Main thread.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="mono" style={{ fontSize: 9, color: "var(--mute-2)" }}>
        what aria knows
      </div>
      {memories.slice(0, 5).map((m) => (
        <div key={m.id}>
          <div className="flex items-center justify-between mb-0.5">
            <span className="mono" style={{ fontSize: 8, color: "var(--mute-3)" }}>
              {m.category.replace(/_/g, " ")}
              {m.learnedFromChat ? " · chat" : ""}
            </span>
            <span className="mono" style={{ fontSize: 8, color: "var(--mute-3)" }}>
              {Math.round(m.confidence * 100)}%
            </span>
          </div>
          <p style={{ fontSize: 10, color: "var(--ink)", lineHeight: 1.45 }}>{m.fact}</p>
          <span className="mono" style={{ fontSize: 7, color: "var(--mute-3)" }}>
            since {new Date(m.validFrom).toLocaleDateString()}
          </span>
        </div>
      ))}
    </div>
  );
}
