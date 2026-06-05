"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@kursa/ui/components/button";
import { Input } from "@kursa/ui/components/input";
import type { UserProject, ProjectCreateInput } from "@kursa/types";

import { api } from "@/lib/api";
import { toProjectInput } from "@/lib/profile-mappers";
import { SectionHeader } from "@/components/dashboard/settings/settings-ui";

type ProjectRow = { id: string; data: ProjectCreateInput };

export default function ProjectsSection({ items: initial }: { items: UserProject[] }) {
  const [items, setItems] = useState<ProjectRow[]>(
    initial.map((item) => ({ id: item.id, data: toProjectInput(item) })),
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [outcomes, setOutcomes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const updateRow = (id: string, patch: Partial<ProjectCreateInput>) => {
    setItems((prev) => prev.map((row) => (row.id === id ? { ...row, data: { ...row.data, ...patch } } : row)));
  };

  const handleSave = async (id: string) => {
    const row = items.find((r) => r.id === id);
    if (!row || !row.data.title.trim()) {
      toast.error("A project needs a title");
      return;
    }
    setSavingId(id);
    try {
      const result = await api.updateProject(id, row.data);
      setItems((prev) => prev.map((r) => (r.id === id ? { id, data: toProjectInput(result.project) } : r)));
      toast.success("Project updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this project?")) return;
    try {
      await api.deleteProject(id);
      setItems((prev) => prev.filter((r) => r.id !== id));
      toast.success("Project removed");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const handleAdd = async () => {
    const t = title.trim();
    if (!t) {
      toast.error("A project needs a title");
      return;
    }
    setAdding(true);
    try {
      const result = await api.createProject({
        title: t,
        description: description.trim() || null,
        url: url.trim() || null,
        outcomes: outcomes.trim(),
        startDate: startDate.trim() || null,
        endDate: endDate.trim() || null,
      });
      setItems((prev) => [...prev, { id: result.project.id, data: toProjectInput(result.project) }]);
      setTitle("");
      setDescription("");
      setUrl("");
      setOutcomes("");
      setStartDate("");
      setEndDate("");
      toast.success("Project added");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <SectionHeader
        eyebrow="projects"
        title="Projects"
        description="Side projects, open source, and portfolio work."
      />

      <div className="rounded-xl p-6 bg-surface border border-line flex flex-col gap-4">
        {items.length === 0 ? (
          <p className="text-xs text-mute">No projects added yet.</p>
        ) : (
          items.map((row) => (
            <div key={row.id} className="rounded-lg p-3 border border-line bg-bg-sub">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 grid gap-2">
                  <Input value={row.data.title} onChange={(e) => updateRow(row.id, { title: e.target.value })} placeholder="Title" />
                  <Input value={row.data.description ?? ""} onChange={(e) => updateRow(row.id, { description: e.target.value || null })} placeholder="Description" />
                  <Input value={row.data.url ?? ""} onChange={(e) => updateRow(row.id, { url: e.target.value || null })} placeholder="URL" />
                  <div className="grid gap-2 md:grid-cols-2">
                    <Input value={row.data.startDate ?? ""} onChange={(e) => updateRow(row.id, { startDate: e.target.value.trim() || null })} placeholder="Start year" />
                    <Input value={row.data.endDate ?? ""} onChange={(e) => updateRow(row.id, { endDate: e.target.value.trim() || null })} placeholder="End year" />
                  </div>
                  <textarea
                    className="min-h-[60px] w-full rounded-md border border-line bg-surface p-3 text-sm text-ink"
                    value={row.data.outcomes}
                    onChange={(e) => updateRow(row.id, { outcomes: e.target.value })}
                    placeholder="Outcomes"
                  />
                </div>
                <button type="button" aria-label="Remove project" onClick={() => handleDelete(row.id)} className="text-mute hover:text-ink">×</button>
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
          <p className="text-xs text-mute font-medium">Add project</p>
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input placeholder="URL (optional)" value={url} onChange={(e) => setUrl(e.target.value)} />
          <div className="grid gap-2 md:grid-cols-2">
            <Input placeholder="Start year" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input placeholder="End year" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <textarea
            className="min-h-[60px] w-full rounded-md border border-line bg-surface p-3 text-sm text-ink"
            placeholder="Outcomes (optional)"
            value={outcomes}
            onChange={(e) => setOutcomes(e.target.value)}
          />
          <div className="flex justify-end">
            <Button type="button" variant="outline" disabled={adding} onClick={handleAdd}>
              {adding ? "Adding…" : "Add project"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
