"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@kursa/ui/components/button";
import { Input } from "@kursa/ui/components/input";
import type { UserEducation, EducationCreateInput } from "@kursa/types";

import { api } from "@/lib/api";
import { toEducationInput } from "@/lib/profile-mappers";

const EDUCATION_TYPES: { value: EducationCreateInput["type"]; label: string }[] = [
  { value: "degree", label: "Degree" },
  { value: "certification", label: "Certification" },
  { value: "course", label: "Course" },
];

type EducationRow = { id: string; data: EducationCreateInput };

export default function EducationSection({ items: initial }: { items: UserEducation[] }) {
  const [items, setItems] = useState<EducationRow[]>(
    initial.map((item) => ({ id: item.id, data: toEducationInput(item) })),
  );
  const [type, setType] = useState<EducationCreateInput["type"]>("degree");
  const [credentialName, setCredentialName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const updateRow = (id: string, patch: Partial<EducationCreateInput>) => {
    setItems((prev) => prev.map((row) => (row.id === id ? { ...row, data: { ...row.data, ...patch } } : row)));
  };

  const handleSave = async (id: string) => {
    const row = items.find((r) => r.id === id);
    if (!row || !row.data.credentialName.trim() || !row.data.issuer.trim()) {
      toast.error("Add the credential and the issuer");
      return;
    }
    setSavingId(id);
    try {
      const result = await api.updateEducation(id, row.data);
      setItems((prev) => prev.map((r) => (r.id === id ? { id, data: toEducationInput(result.education) } : r)));
      toast.success("Education updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this education entry?")) return;
    try {
      await api.deleteEducation(id);
      setItems((prev) => prev.filter((r) => r.id !== id));
      toast.success("Education removed");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const handleAdd = async () => {
    const name = credentialName.trim();
    const org = issuer.trim();
    if (!name || !org) {
      toast.error("Add the credential and the issuer");
      return;
    }
    setAdding(true);
    try {
      const result = await api.createEducation({
        type,
        credentialName: name,
        issuer: org,
        completionDate: completionDate.trim() || null,
      });
      setItems((prev) => [...prev, { id: result.education.id, data: toEducationInput(result.education) }]);
      setType("degree");
      setCredentialName("");
      setIssuer("");
      setCompletionDate("");
      toast.success("Education added");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="rounded-xl p-6 bg-bg-sub border border-line flex flex-col gap-4">
        {items.length === 0 ? (
          <p className="text-xs text-mute">No education added yet.</p>
        ) : (
          items.map((row) => (
            <div key={row.id} className="rounded-lg p-3 border border-line bg-bg-sub">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 grid gap-2">
                  <select
                    className="w-full rounded-md border border-line bg-surface p-2 text-ink text-sm"
                    value={row.data.type}
                    onChange={(e) => updateRow(row.id, { type: e.target.value as EducationCreateInput["type"] })}
                  >
                    {EDUCATION_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <Input value={row.data.credentialName} onChange={(e) => updateRow(row.id, { credentialName: e.target.value })} placeholder="Credential" />
                  <Input value={row.data.issuer} onChange={(e) => updateRow(row.id, { issuer: e.target.value })} placeholder="Issuer" />
                  <Input value={row.data.completionDate ?? ""} onChange={(e) => updateRow(row.id, { completionDate: e.target.value.trim() || null })} placeholder="Year" />
                </div>
                <button type="button" aria-label="Remove education" onClick={() => handleDelete(row.id)} className="text-mute hover:text-ink">×</button>
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
          <p className="text-xs text-mute font-medium">Add education</p>
          <select
            className="w-full rounded-md border border-line bg-surface p-2 text-ink text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as EducationCreateInput["type"])}
          >
            {EDUCATION_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Input placeholder="Credential (e.g. BSc Computer Science)" value={credentialName} onChange={(e) => setCredentialName(e.target.value)} />
          <Input placeholder="Issuer (university or body)" value={issuer} onChange={(e) => setIssuer(e.target.value)} />
          <Input placeholder="Year (e.g. 2019)" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} />
          <div className="flex justify-end">
            <Button type="button" variant="outline" disabled={adding} onClick={handleAdd}>
              {adding ? "Adding…" : "Add education"}
            </Button>
          </div>
        </div>
    </div>
  );
}
