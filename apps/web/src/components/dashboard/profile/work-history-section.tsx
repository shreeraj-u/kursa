"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@kursa/ui/components/button";
import { Input } from "@kursa/ui/components/input";
import type { UserWorkHistory, WorkHistoryCreateInput } from "@kursa/types";

import { api } from "@/lib/api";
import { toWorkHistoryInput } from "@/lib/profile-mappers";

type WorkHistoryRow = { id: string; data: WorkHistoryCreateInput };

const YEAR_PATTERN = /^\d{4}$/;

function validateEntry(item: WorkHistoryCreateInput): string | null {
  if (!item.companyName.trim() || !item.roleTitle.trim() || !item.outcomes.trim()) {
    return "Fill in company, role, and outcomes";
  }
  if (!item.startDate || !YEAR_PATTERN.test(item.startDate)) {
    return "Add a valid four-digit start year";
  }
  if (item.endDate && !YEAR_PATTERN.test(item.endDate)) {
    return "End year must be a valid four-digit year";
  }
  if (item.endDate && Number(item.endDate) < Number(item.startDate)) {
    return "End year cannot be before start year";
  }
  return null;
}

export default function WorkHistorySection({ items: initial }: { items: UserWorkHistory[] }) {
  const [items, setItems] = useState<WorkHistoryRow[]>(
    initial.map((item) => ({ id: item.id, data: toWorkHistoryInput(item) })),
  );
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [outcomes, setOutcomes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const updateRow = (id: string, patch: Partial<WorkHistoryCreateInput>) => {
    setItems((prev) => prev.map((row) => (row.id === id ? { ...row, data: { ...row.data, ...patch } } : row)));
  };

  const handleSave = async (id: string) => {
    const row = items.find((r) => r.id === id);
    if (!row) return;
    const error = validateEntry(row.data);
    if (error) {
      toast.error(error);
      return;
    }
    setSavingId(id);
    try {
      const result = await api.updateWorkHistory(id, row.data);
      setItems((prev) => prev.map((r) => (r.id === id ? { id, data: toWorkHistoryInput(result.workHistory) } : r)));
      toast.success("Experience updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this work experience?")) return;
    try {
      await api.deleteWorkHistory(id);
      setItems((prev) => prev.filter((r) => r.id !== id));
      toast.success("Experience removed");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const handleAdd = async () => {
    const next: WorkHistoryCreateInput = {
      companyName: companyName.trim(),
      roleTitle: roleTitle.trim(),
      outcomes: outcomes.trim(),
      startDate: startDate.trim(),
      endDate: isCurrent ? null : endDate.trim() || null,
      isCurrent,
    };
    const error = validateEntry(next);
    if (error) {
      toast.error(error);
      return;
    }
    setAdding(true);
    try {
      const result = await api.createWorkHistory(next);
      setItems((prev) => [...prev, { id: result.workHistory.id, data: toWorkHistoryInput(result.workHistory) }]);
      setCompanyName("");
      setRoleTitle("");
      setOutcomes("");
      setStartDate("");
      setEndDate("");
      setIsCurrent(false);
      toast.success("Experience added");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="rounded-xl p-6 bg-bg-sub border border-line flex flex-col gap-4">
        {items.length === 0 ? (
          <p className="text-xs text-mute">No experience added yet.</p>
        ) : (
          items.map((row) => (
            <div key={row.id} className="rounded-lg p-3 border border-line bg-bg-sub">
              <div className="flex items-start justify-between gap-3">
                <div className="grid flex-1 gap-2 md:grid-cols-2">
                  <Input
                    aria-label="Company name"
                    value={row.data.companyName}
                    onChange={(e) => updateRow(row.id, { companyName: e.target.value })}
                  />
                  <Input
                    aria-label="Role title"
                    value={row.data.roleTitle}
                    onChange={(e) => updateRow(row.id, { roleTitle: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  aria-label="Remove role"
                  onClick={() => handleDelete(row.id)}
                  className="text-mute hover:text-ink transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                <Input
                  aria-label="Start year"
                  placeholder="Start year"
                  value={row.data.startDate}
                  onChange={(e) => updateRow(row.id, { startDate: e.target.value.trim() })}
                />
                <Input
                  aria-label="End year"
                  placeholder="End year"
                  value={row.data.endDate ?? ""}
                  disabled={row.data.isCurrent}
                  onChange={(e) => updateRow(row.id, { endDate: e.target.value.trim() || null })}
                />
                <label className="flex items-center gap-2 text-xs text-mute">
                  <input
                    type="checkbox"
                    checked={row.data.isCurrent}
                    onChange={(e) =>
                      updateRow(row.id, {
                        isCurrent: e.target.checked,
                        endDate: e.target.checked ? null : row.data.endDate,
                      })
                    }
                  />
                  Current role
                </label>
              </div>
              <textarea
                className="mt-2 min-h-[72px] w-full rounded-md border border-line bg-surface p-3 text-sm text-ink"
                value={row.data.outcomes}
                onChange={(e) => updateRow(row.id, { outcomes: e.target.value })}
              />
              <div className="flex justify-end mt-2">
                <Button type="button" size="sm" variant="outline" disabled={savingId === row.id} onClick={() => handleSave(row.id)}>
                  {savingId === row.id ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          ))
        )}

        <div className="pt-2 border-t border-line flex flex-col gap-3">
          <p className="text-xs text-mute font-medium">Add experience</p>
          <div className="grid gap-2 md:grid-cols-2">
            <Input placeholder="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            <Input placeholder="Role title" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} />
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <Input placeholder="Start year (required)" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input placeholder="End year" value={endDate} disabled={isCurrent} onChange={(e) => setEndDate(e.target.value)} />
            <label className="flex items-center gap-2 text-xs text-mute">
              <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} />
              Current role
            </label>
          </div>
          <textarea
            className="min-h-[72px] w-full rounded-md border border-line bg-surface p-3 text-sm text-ink"
            placeholder="Outcomes, scope, impact..."
            value={outcomes}
            onChange={(e) => setOutcomes(e.target.value)}
          />
          <div className="flex justify-end">
            <Button type="button" variant="outline" disabled={adding} onClick={handleAdd}>
              {adding ? "Adding…" : "Add role"}
            </Button>
          </div>
        </div>
    </div>
  );
}
