import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ApplicationCreateInput, JobApplicationStage, JobApplicationStatus } from "@kursa/types";
import { STAGE_ORDER, STAGE_LABEL, STATUS_LABEL } from "./constants";

const EMPTY: ApplicationCreateInput = {
  company: "",
  roleTitle: "",
  stage: "shortlisted",
  status: "active",
  url: null,
  notes: null,
};

export interface ApplicationFormProps {
  initial?: ApplicationCreateInput;
  onSave: (data: ApplicationCreateInput) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

export function ApplicationForm({ initial = EMPTY, onSave, onCancel, saving }: ApplicationFormProps) {
  const [form, setForm] = useState<ApplicationCreateInput>(initial);

  const set = <K extends keyof ApplicationCreateInput>(key: K, value: ApplicationCreateInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company.trim() || !form.roleTitle.trim()) return;
    await onSave(form);
  }

  const labelClass = "block text-[10px] text-mute-2 font-mono tracking-[0.04em] mb-1";
  const inputClass = "w-full bg-bg-sub border border-line-2 rounded-[6px] px-2.5 py-1.5 text-xs text-ink outline-none focus:border-line-3 focus:ring-1 focus:ring-line-3 transition-all duration-150";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Company *</label>
          <input
            className={inputClass}
            value={form.company}
            onChange={(e) => set("company", e.target.value)}
            placeholder="Acme Corp"
            required
          />
        </div>
        <div>
          <label className={labelClass}>Role *</label>
          <input
            className={inputClass}
            value={form.roleTitle}
            onChange={(e) => set("roleTitle", e.target.value)}
            placeholder="Software Engineer"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Stage</label>
          <div className="relative">
            <select
              className={`${inputClass} pr-7 appearance-none`}
              value={form.stage}
              onChange={(e) => set("stage", e.target.value as JobApplicationStage)}
            >
              {STAGE_ORDER.map((s) => (
                <option key={s} value={s}>{STAGE_LABEL[s]}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-mute-2 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <div className="relative">
            <select
              className={`${inputClass} pr-7 appearance-none`}
              value={form.status}
              onChange={(e) => set("status", e.target.value as JobApplicationStatus)}
            >
              {(["active", "passed", "closed"] as JobApplicationStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-mute-2 pointer-events-none" />
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass}>Job URL</label>
        <input
          className={inputClass}
          type="url"
          value={form.url ?? ""}
          onChange={(e) => set("url", e.target.value || null)}
          placeholder="https://..."
        />
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          className={`${inputClass} resize-y min-h-[64px]`}
          value={form.notes ?? ""}
          onChange={(e) => set("notes", e.target.value || null)}
          placeholder="Recruiter name, key contact, follow-up notes..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="mono text-[11px] px-3 py-[5px] rounded-[6px] border border-line-2 bg-transparent text-mute hover:bg-bg-sub hover:text-ink cursor-pointer transition-colors duration-150"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="mono text-[11px] px-3 py-[5px] rounded-[6px] border-none bg-accent text-white hover:bg-opacity-95 transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
