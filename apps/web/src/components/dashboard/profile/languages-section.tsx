"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@kursa/ui/components/button";
import { Input } from "@kursa/ui/components/input";
import type { UserLanguage, LanguageCreateInput } from "@kursa/types";

import { api } from "@/lib/api";
import { toLanguageInput } from "@/lib/profile-mappers";
import { SectionHeader } from "@/components/dashboard/settings/settings-ui";

const PROFICIENCIES: { value: LanguageCreateInput["proficiency"]; label: string }[] = [
  { value: "Native", label: "Native" },
  { value: "Fluent", label: "Fluent" },
  { value: "Conversational", label: "Conversational" },
  { value: "Basic", label: "Basic" },
];

type LanguageRow = { id: string; data: LanguageCreateInput };

export default function LanguagesSection({ items: initial }: { items: UserLanguage[] }) {
  const [items, setItems] = useState<LanguageRow[]>(
    initial.map((item) => ({ id: item.id, data: toLanguageInput(item) })),
  );
  const [name, setName] = useState("");
  const [proficiency, setProficiency] = useState<LanguageCreateInput["proficiency"]>("Fluent");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const updateRow = (id: string, patch: Partial<LanguageCreateInput>) => {
    setItems((prev) => prev.map((row) => (row.id === id ? { ...row, data: { ...row.data, ...patch } } : row)));
  };

  const handleSave = async (id: string) => {
    const row = items.find((r) => r.id === id);
    if (!row || !row.data.name.trim()) {
      toast.error("Add a language name");
      return;
    }
    setSavingId(id);
    try {
      const result = await api.updateLanguage(id, row.data);
      setItems((prev) => prev.map((r) => (r.id === id ? { id, data: toLanguageInput(result.language) } : r)));
      toast.success("Language updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this language?")) return;
    try {
      await api.deleteLanguage(id);
      setItems((prev) => prev.filter((r) => r.id !== id));
      toast.success("Language removed");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const handleAdd = async () => {
    const n = name.trim();
    if (!n) {
      toast.error("Add a language name");
      return;
    }
    if (items.some((row) => row.data.name.toLowerCase() === n.toLowerCase())) {
      toast.error("Already added that language");
      return;
    }
    setAdding(true);
    try {
      const result = await api.createLanguage({ name: n, proficiency });
      setItems((prev) => [...prev, { id: result.language.id, data: toLanguageInput(result.language) }]);
      setName("");
      setProficiency("Fluent");
      toast.success("Language added");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <SectionHeader
        eyebrow="languages"
        title="Languages"
        description="Languages you speak and your proficiency level."
      />

      <div className="rounded-xl p-6 bg-surface border border-line flex flex-col gap-4">
        {items.length === 0 ? (
          <p className="text-xs text-mute">No languages added yet.</p>
        ) : (
          items.map((row) => (
            <div key={row.id} className="rounded-lg p-3 border border-line bg-bg-sub">
              <div className="flex items-center justify-between gap-3">
                <div className="grid flex-1 gap-2 md:grid-cols-2">
                  <Input value={row.data.name} onChange={(e) => updateRow(row.id, { name: e.target.value })} placeholder="Language" />
                  <select
                    className="w-full rounded-md border border-line bg-surface p-2 text-ink text-sm"
                    value={row.data.proficiency}
                    onChange={(e) => updateRow(row.id, { proficiency: e.target.value as LanguageCreateInput["proficiency"] })}
                  >
                    {PROFICIENCIES.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <button type="button" aria-label="Remove language" onClick={() => handleDelete(row.id)} className="text-mute hover:text-ink">×</button>
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
          <p className="text-xs text-mute font-medium">Add language</p>
          <div className="grid gap-2 md:grid-cols-2">
            <Input placeholder="Language (e.g. English)" value={name} onChange={(e) => setName(e.target.value)} />
            <select
              className="w-full rounded-md border border-line bg-surface p-2 text-ink text-sm"
              value={proficiency}
              onChange={(e) => setProficiency(e.target.value as LanguageCreateInput["proficiency"])}
            >
              {PROFICIENCIES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="outline" disabled={adding} onClick={handleAdd}>
              {adding ? "Adding…" : "Add language"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
