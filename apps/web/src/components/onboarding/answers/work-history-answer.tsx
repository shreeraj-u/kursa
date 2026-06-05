import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@kursa/ui/components/button";
import { Input } from "@kursa/ui/components/input";

import type { WorkHistoryInput } from "@kursa/types";

import { UnsavedDraftGuard } from "./unsaved-draft-guard";

type WorkHistoryAnswerProps = {
  items: WorkHistoryInput[];
  onChange: (items: WorkHistoryInput[]) => void;
  onSubmit: () => void;
  onBack: () => void;
};

const YEAR_PATTERN = /^\d{4}$/;

function isValidYear(value: string): boolean {
  if (!YEAR_PATTERN.test(value)) return false;
  const year = Number(value);
  const currentYear = new Date().getFullYear();
  return year >= 1900 && year <= currentYear + 10;
}

function validateEntry(item: WorkHistoryInput): string | null {
  if (!item.companyName.trim() || !item.roleTitle.trim() || !item.outcomes.trim()) {
    return "Fill in company, role, and outcomes";
  }
  if (!item.startDate || !isValidYear(item.startDate)) {
    return "Add a valid four-digit start year for every role";
  }
  if (item.endDate && !isValidYear(item.endDate)) {
    return "End year must be a valid four-digit year";
  }
  if (item.endDate && Number(item.endDate) < Number(item.startDate)) {
    return "End year cannot be before start year";
  }
  return null;
}

export function WorkHistoryAnswer(props: WorkHistoryAnswerProps) {
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [outcomes, setOutcomes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);

  const updateEntry = (index: number, patch: Partial<WorkHistoryInput>) => {
    props.onChange(props.items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const hasDraft = Boolean(
    companyName.trim() || roleTitle.trim() || outcomes.trim() || startDate.trim() || endDate.trim(),
  );

  const addEntry = (): boolean => {
    const company = companyName.trim();
    const role = roleTitle.trim();
    const outcomeText = outcomes.trim();
    const startYear = startDate.trim();
    const endYear = endDate.trim();
    const next: WorkHistoryInput = {
      companyName: company,
      roleTitle: role,
      outcomes: outcomeText,
      startDate: startYear,
      endDate: isCurrent ? null : endYear || null,
      isCurrent,
    };
    const validationMessage = validateEntry(next);
    if (validationMessage) {
      toast.error(validationMessage);
      return false;
    }
    if (props.items.some(
      (item) =>
        item.companyName.toLowerCase() === company.toLowerCase() &&
        item.roleTitle.toLowerCase() === role.toLowerCase(),
    )) {
      toast.error("Already added that role at that company");
      return false;
    }
    props.onChange([...props.items, next]);
    setCompanyName("");
    setRoleTitle("");
    setOutcomes("");
    setStartDate("");
    setEndDate("");
    setIsCurrent(false);
    return true;
  };

  const submit = () => {
    const invalid = props.items.map(validateEntry).find(Boolean);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    props.onSubmit();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {props.items.length === 0 ? (
          <p style={{ fontSize: "var(--text-xs)", color: "var(--mute)" }}>No experience added yet.</p>
        ) : (
          props.items.map((item, i) => (
            <div
              key={i}
              className="rounded-lg p-3"
              style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="grid flex-1 gap-2 md:grid-cols-2">
                  <Input aria-label="Company name" value={item.companyName} onChange={(e) => updateEntry(i, { companyName: e.target.value })} />
                  <Input aria-label="Role title" value={item.roleTitle} onChange={(e) => updateEntry(i, { roleTitle: e.target.value })} />
                </div>
                <button
                  type="button"
                  aria-label="Remove role"
                  onClick={() => props.onChange(props.items.filter((_, j) => j !== i))}
                  style={{ color: "var(--mute)" }}
                >×</button>
              </div>
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                <Input aria-label="Start year" placeholder="Start year" value={item.startDate ?? ""} onChange={(e) => updateEntry(i, { startDate: e.target.value.trim() })} />
                <Input aria-label="End year" placeholder="End year" value={item.endDate ?? ""} disabled={item.isCurrent} onChange={(e) => updateEntry(i, { endDate: e.target.value.trim() || null })} />
                <label className="flex items-center gap-2 text-xs text-mute">
                  <input type="checkbox" checked={item.isCurrent} onChange={(e) => updateEntry(i, { isCurrent: e.target.checked, endDate: e.target.checked ? null : item.endDate })} />
                  Current role
                </label>
              </div>
              <textarea
                className="mt-2 min-h-[72px] w-full rounded-md border bg-[var(--surface)] p-3"
                style={{ borderColor: "var(--line)", fontSize: "var(--text-sm)", color: "var(--ink)" }}
                value={item.outcomes}
                onChange={(e) => updateEntry(i, { outcomes: e.target.value })}
              />
            </div>
          ))
        )}
      </div>

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
        className="min-h-[72px] w-full rounded-md border bg-[var(--surface)] p-3"
        style={{ borderColor: "var(--line)", fontSize: "var(--text-sm)", color: "var(--ink)" }}
        placeholder="Outcomes, scope, impact..."
        value={outcomes}
        onChange={(e) => setOutcomes(e.target.value)}
      />
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={addEntry}>Add role</Button>
      </div>

      <UnsavedDraftGuard
        hasDraft={hasDraft}
        itemLabel="a work history entry"
        addLabel="Add role"
        onAdd={addEntry}
        onContinue={submit}
        onBack={props.onBack}
      />
    </div>
  );
}
