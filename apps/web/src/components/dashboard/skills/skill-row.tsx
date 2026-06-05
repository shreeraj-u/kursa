"use client";

import type { SkillSummary, SkillUpdateInput } from "@kursa/types";

type Props = {
  skill: SkillSummary;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (patch: SkillUpdateInput) => void;
  onDelete: () => void;
};

export function SkillRow({ skill, editing, onEdit, onCancel, onSave, onDelete }: Props) {
  const maxW = 5;
  const conf = skill.confidenceRating ?? 3;

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-md p-2" style={{ background: "var(--bg-sub)" }}>
        <span className="text-xs font-medium">{skill.name}</span>
        <label className="mono text-2xs text-mute">
          confidence
          <input
            type="range"
            min={1}
            max={5}
            defaultValue={conf}
            id={`conf-${skill.id}`}
            className="mt-1 w-full"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById(`conf-${skill.id}`) as HTMLInputElement | null;
              onSave({ confidenceRating: el ? Number(el.value) : conf });
            }}
            className="mono text-2xs text-accent"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="mono text-2xs text-mute"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <span
        className="flex-shrink-0 truncate"
        style={{
          width: 120,
          fontSize: 11,
          color: skill.isStale ? "var(--mute-3)" : "var(--ink)",
        }}
      >
        {skill.name}
      </span>
      <div className="flex gap-px flex-1" style={{ maxWidth: 70 }}>
        {Array.from({ length: maxW }).map((_, i) => (
          <i
            key={i}
            className="not-italic rounded-[1px]"
            style={{
              flex: 1,
              height: 5,
              background: i < conf ? (skill.isStale ? "var(--line-3)" : "var(--ink-3)") : "var(--line)",
            }}
          />
        ))}
      </div>
      <span className="mono flex-shrink-0 text-2xs text-mute-3" style={{ minWidth: 56 }}>
        {skill.isStale ? "stale" : skill.lastUsedDate ? "active" : "—"}
      </span>
      <button
        type="button"
        onClick={onEdit}
        className="mono opacity-0 group-hover:opacity-100 text-2xs text-mute-2"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="mono opacity-0 group-hover:opacity-100 text-2xs text-warn"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        ×
      </button>
    </div>
  );
}
