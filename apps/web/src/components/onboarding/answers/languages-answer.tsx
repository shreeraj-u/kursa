import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@kursa/ui/components/button";
import { Input } from "@kursa/ui/components/input";

import type { LanguageInput } from "@kursa/types";

import { UnsavedDraftGuard } from "./unsaved-draft-guard";

type LanguagesAnswerProps = {
  items: LanguageInput[];
  onChange: (items: LanguageInput[]) => void;
  onSubmit: () => void;
  onBack: () => void;
};

const PROFICIENCIES: { value: LanguageInput["proficiency"]; label: string }[] = [
  { value: "Native", label: "Native" },
  { value: "Fluent", label: "Fluent" },
  { value: "Conversational", label: "Conversational" },
  { value: "Basic", label: "Basic" },
];

export function LanguagesAnswer(props: LanguagesAnswerProps) {
  const [name, setName] = useState("");
  const [proficiency, setProficiency] = useState<LanguageInput["proficiency"]>("Fluent");

  const hasDraft = Boolean(name.trim());

  const addEntry = (): boolean => {
    const n = name.trim();
    if (!n) {
      toast.error("Add a language name");
      return false;
    }
    if (props.items.some((item) => item.name.toLowerCase() === n.toLowerCase())) {
      toast.error("Already added that language");
      return false;
    }
    props.onChange([...props.items, { name: n, proficiency }]);
    setName("");
    setProficiency("Fluent");
    return true;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {props.items.length === 0 ? (
          <p className="text-xs text-mute">No languages added yet.</p>
        ) : (
          props.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg p-3 border border-line bg-surface"
            >
              <p className="text-sm text-ink">
                <span className="font-semibold">{item.name}</span> · {item.proficiency}
              </p>
              <button
                type="button"
                aria-label="Remove language"
                onClick={() => props.onChange(props.items.filter((_, j) => j !== i))}
                className="text-mute hover:text-ink transition-colors"
              >×</button>
            </div>
          ))
        )}
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <Input placeholder="Language (e.g. English)" value={name} onChange={(e) => setName(e.target.value)} />
        <select
          className="w-full rounded-md border border-line bg-surface p-2 text-ink text-sm"
          value={proficiency}
          onChange={(e) => setProficiency(e.target.value as LanguageInput["proficiency"])}
        >
          {PROFICIENCIES.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={addEntry}>Add language</Button>
      </div>

      <UnsavedDraftGuard
        hasDraft={hasDraft}
        itemLabel="a language"
        addLabel="Add language"
        onAdd={addEntry}
        onContinue={props.onSubmit}
        onBack={props.onBack}
      />
    </div>
  );
}
