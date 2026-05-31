import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@kursa/ui/components/button";
import { Input } from "@kursa/ui/components/input";

import type { EducationInput } from "@kursa/types";

type EducationAnswerProps = {
  items: EducationInput[];
  onChange: (items: EducationInput[]) => void;
  onSubmit: () => void;
  onBack: () => void;
};

const EDUCATION_TYPES: { value: EducationInput["type"]; label: string }[] = [
  { value: "degree", label: "Degree" },
  { value: "certification", label: "Certification" },
  { value: "course", label: "Course" },
];

export function EducationAnswer(props: EducationAnswerProps) {
  const [type, setType] = useState<EducationInput["type"]>("degree");
  const [credentialName, setCredentialName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [completionDate, setCompletionDate] = useState("");

  const addEntry = () => {
    const name = credentialName.trim();
    const org = issuer.trim();
    if (!name || !org) {
      toast.error("Add the credential and the issuer");
      return;
    }
    props.onChange([
      ...props.items,
      { type, credentialName: name, issuer: org, completionDate: completionDate.trim() || null },
    ]);
    setType("degree");
    setCredentialName("");
    setIssuer("");
    setCompletionDate("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {props.items.length === 0 ? (
          <p className="text-xs text-mute">No education added yet.</p>
        ) : (
          props.items.map((item, i) => (
            <div
              key={i}
              className="rounded-lg p-3 border border-line bg-surface"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-ink font-semibold">{item.credentialName}</p>
                  <p className="text-xs text-mute">
                    {item.issuer}
                    {item.completionDate ? ` · ${item.completionDate}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Remove education"
                  onClick={() => props.onChange(props.items.filter((_, j) => j !== i))}
                  className="text-mute hover:text-ink transition-colors"
                >×</button>
              </div>
            </div>
          ))
        )}
      </div>

      <select
        className="w-full rounded-md border border-line bg-surface p-2 text-ink text-sm"
        value={type}
        onChange={(e) => setType(e.target.value as EducationInput["type"])}
      >
        {EDUCATION_TYPES.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <Input placeholder="Credential (e.g. BSc Computer Science)" value={credentialName} onChange={(e) => setCredentialName(e.target.value)} />
      <Input placeholder="Issuer (university or body)" value={issuer} onChange={(e) => setIssuer(e.target.value)} />
      <Input placeholder="Year (e.g. 2019)" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} />
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={addEntry}>Add education</Button>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={props.onBack}>Back</Button>
        <Button type="button" onClick={props.onSubmit}>Continue</Button>
      </div>
    </div>
  );
}
