import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@kursa/ui/components/button";
import { Input } from "@kursa/ui/components/input";

import type { WorkHistoryInput } from "@/app/onboarding/schema";

type WorkHistoryAnswerProps = {
  items: WorkHistoryInput[];
  onChange: (items: WorkHistoryInput[]) => void;
  onSubmit: () => void;
  onBack: () => void;
};

export function WorkHistoryAnswer(props: WorkHistoryAnswerProps) {
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [outcomes, setOutcomes] = useState("");

  const addEntry = () => {
    const company = companyName.trim();
    const role = roleTitle.trim();
    const outcomeText = outcomes.trim();
    if (!company || !role || !outcomeText) {
      toast.error("Fill in company, role, and outcomes");
      return;
    }
    if (props.items.some(
      (item) =>
        item.companyName.toLowerCase() === company.toLowerCase() &&
        item.roleTitle.toLowerCase() === role.toLowerCase(),
    )) {
      toast.error("Already added that role at that company");
      return;
    }
    props.onChange([...props.items, { companyName: company, roleTitle: role, outcomes: outcomeText, startDate: null, endDate: null, isCurrent: false }]);
    setCompanyName("");
    setRoleTitle("");
    setOutcomes("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {props.items.length === 0 ? (
          <p className="text-xs text-mute">No experience added yet.</p>
        ) : (
          props.items.map((item, i) => (
            <div
              key={i}
              className="rounded-lg p-3 border border-line bg-surface"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-ink font-semibold">{item.roleTitle}</p>
                  <p className="text-xs text-mute">{item.companyName}</p>
                </div>
                <button
                  type="button"
                  aria-label="Remove role"
                  onClick={() => props.onChange(props.items.filter((_, j) => j !== i))}
                  className="text-mute hover:text-ink transition-colors"
                >×</button>
              </div>
              <p className="mt-2 text-xs text-ink">{item.outcomes}</p>
            </div>
          ))
        )}
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <Input placeholder="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        <Input placeholder="Role title" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} />
      </div>
      <textarea
        className="min-h-[72px] w-full rounded-md border border-line bg-surface p-3 text-ink text-sm"
        placeholder="Outcomes, scope, impact..."
        value={outcomes}
        onChange={(e) => setOutcomes(e.target.value)}
      />
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={addEntry}>Add role</Button>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={props.onBack}>Back</Button>
        <Button type="button" onClick={props.onSubmit}>Continue</Button>
      </div>
    </div>
  );
}
