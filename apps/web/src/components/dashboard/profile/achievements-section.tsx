"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@kursa/ui/components/button";
import { Input } from "@kursa/ui/components/input";
import type { UserAchievement, AchievementCreateInput } from "@kursa/types";

import { api } from "@/lib/api";
import { toAchievementInput } from "@/lib/profile-mappers";
import { SectionHeader } from "@/components/dashboard/settings/settings-ui";

const ACHIEVEMENT_TYPES: { value: AchievementCreateInput["type"]; label: string }[] = [
  { value: "HACKATHON", label: "Hackathon" },
  { value: "AWARD", label: "Award" },
  { value: "PUBLICATION", label: "Publication" },
  { value: "SPEAKING", label: "Speaking" },
  { value: "OPEN_SOURCE", label: "Open source" },
  { value: "VOLUNTEER", label: "Volunteer" },
  { value: "OTHER", label: "Other" },
];

type AchievementRow = { id: string; data: AchievementCreateInput };

export default function AchievementsSection({ items: initial }: { items: UserAchievement[] }) {
  const [items, setItems] = useState<AchievementRow[]>(
    initial.map((item) => ({ id: item.id, data: toAchievementInput(item) })),
  );
  const [type, setType] = useState<AchievementCreateInput["type"]>("OTHER");
  const [title, setTitle] = useState("");
  const [issuer, setIssuer] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [dateAchieved, setDateAchieved] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const updateRow = (id: string, patch: Partial<AchievementCreateInput>) => {
    setItems((prev) => prev.map((row) => (row.id === id ? { ...row, data: { ...row.data, ...patch } } : row)));
  };

  const handleSave = async (id: string) => {
    const row = items.find((r) => r.id === id);
    if (!row || !row.data.title.trim()) {
      toast.error("An achievement needs a title");
      return;
    }
    setSavingId(id);
    try {
      const result = await api.updateAchievement(id, row.data);
      setItems((prev) => prev.map((r) => (r.id === id ? { id, data: toAchievementInput(result.achievement) } : r)));
      toast.success("Achievement updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this achievement?")) return;
    try {
      await api.deleteAchievement(id);
      setItems((prev) => prev.filter((r) => r.id !== id));
      toast.success("Achievement removed");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const handleAdd = async () => {
    const t = title.trim();
    if (!t) {
      toast.error("An achievement needs a title");
      return;
    }
    setAdding(true);
    try {
      const result = await api.createAchievement({
        type,
        title: t,
        issuer: issuer.trim() || null,
        description: description.trim() || null,
        url: url.trim() || null,
        dateAchieved: dateAchieved.trim() || null,
      });
      setItems((prev) => [...prev, { id: result.achievement.id, data: toAchievementInput(result.achievement) }]);
      setType("OTHER");
      setTitle("");
      setIssuer("");
      setDescription("");
      setUrl("");
      setDateAchieved("");
      toast.success("Achievement added");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <SectionHeader
        eyebrow="achievements"
        title="Achievements"
        description="Awards, publications, speaking, and other highlights."
      />

      <div className="rounded-xl p-6 bg-surface border border-line flex flex-col gap-4">
        {items.length === 0 ? (
          <p className="text-xs text-mute">No achievements added yet.</p>
        ) : (
          items.map((row) => (
            <div key={row.id} className="rounded-lg p-3 border border-line bg-bg-sub">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 grid gap-2">
                  <select
                    className="w-full rounded-md border border-line bg-surface p-2 text-ink text-sm"
                    value={row.data.type}
                    onChange={(e) => updateRow(row.id, { type: e.target.value as AchievementCreateInput["type"] })}
                  >
                    {ACHIEVEMENT_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <Input value={row.data.title} onChange={(e) => updateRow(row.id, { title: e.target.value })} placeholder="Title" />
                  <Input value={row.data.issuer ?? ""} onChange={(e) => updateRow(row.id, { issuer: e.target.value || null })} placeholder="Issuer" />
                  <Input value={row.data.description ?? ""} onChange={(e) => updateRow(row.id, { description: e.target.value || null })} placeholder="Description" />
                  <Input value={row.data.url ?? ""} onChange={(e) => updateRow(row.id, { url: e.target.value || null })} placeholder="URL" />
                  <Input value={row.data.dateAchieved ?? ""} onChange={(e) => updateRow(row.id, { dateAchieved: e.target.value.trim() || null })} placeholder="Year" />
                </div>
                <button type="button" aria-label="Remove achievement" onClick={() => handleDelete(row.id)} className="text-mute hover:text-ink">×</button>
              </div>
              <div className="flex justify-end mt-2">
                <Button type="button" size="sm" variant="outline" disabled={savingId === row.id} onClick={() => handleSave(row.id)}>
                  {savingId === row.id ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          ))
        )}

        <div className="pt-2 border-t border-line flex flex-col gap-3">
          <p className="text-xs text-mute font-medium">Add achievement</p>
          <select
            className="w-full rounded-md border border-line bg-surface p-2 text-ink text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as AchievementCreateInput["type"])}
          >
            {ACHIEVEMENT_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Issuer / organisation (optional)" value={issuer} onChange={(e) => setIssuer(e.target.value)} />
          <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input placeholder="URL (optional)" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Input placeholder="Year (e.g. 2023)" value={dateAchieved} onChange={(e) => setDateAchieved(e.target.value)} />
          <div className="flex justify-end">
            <Button type="button" variant="outline" disabled={adding} onClick={handleAdd}>
              {adding ? "Adding…" : "Add achievement"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
