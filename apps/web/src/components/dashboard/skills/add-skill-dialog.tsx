"use client";

import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/lib/api";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export function AddSkillDialog({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"technical" | "soft" | "tool">("technical");
  const [confidence, setConfidence] = useState(3);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function submit() {
    if (!name.trim()) {
      toast.error("Enter a skill name");
      return;
    }
    setSaving(true);
    try {
      await api.skills.create({
        name: name.trim(),
        category,
        confidenceRating: confidence,
        source: "user_edited",
      });
      toast.success("Skill added");
      setName("");
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add skill");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "oklch(0 0 0 / 0.4)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg p-5"
        style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold text-ink">Add skill</h2>
        <div className="mt-4 flex flex-col gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. JavaScript"
            className="w-full rounded px-3 py-2 text-sm outline-none"
            style={{ border: "1px solid var(--line)", background: "var(--bg)" }}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
            className="w-full rounded px-3 py-2 text-sm"
            style={{ border: "1px solid var(--line)", background: "var(--bg)" }}
          >
            <option value="technical">Technical</option>
            <option value="soft">Soft</option>
            <option value="tool">Tool</option>
          </select>
          <label className="mono text-2xs text-mute">
            confidence ({confidence})
            <input
              type="range"
              min={1}
              max={5}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="mono rounded px-3 py-1.5 text-2xs"
            style={{ border: "1px solid var(--line)", background: "transparent", cursor: "pointer" }}
          >
            cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void submit()}
            className="mono rounded px-3 py-1.5 text-2xs"
            style={{
              background: "var(--ink)",
              color: "var(--bg)",
              border: "none",
              cursor: saving ? "wait" : "pointer",
            }}
          >
            {saving ? "saving…" : "add"}
          </button>
        </div>
      </div>
    </div>
  );
}
