import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@kursa/ui/components/button";
import { Input } from "@kursa/ui/components/input";

import type { AchievementInput } from "@kursa/types";

import { UnsavedDraftGuard } from "./unsaved-draft-guard";

type AchievementAnswerProps = {
  items: AchievementInput[];
  onChange: (items: AchievementInput[]) => void;
  onSubmit: () => void;
  onBack: () => void;
};

const ACHIEVEMENT_TYPES: { value: AchievementInput["type"]; label: string }[] = [
  { value: "HACKATHON", label: "Hackathon" },
  { value: "AWARD", label: "Award" },
  { value: "PUBLICATION", label: "Publication" },
  { value: "SPEAKING", label: "Speaking" },
  { value: "OPEN_SOURCE", label: "Open source" },
  { value: "VOLUNTEER", label: "Volunteer" },
  { value: "OTHER", label: "Other" },
];

export function AchievementAnswer(props: AchievementAnswerProps) {
  const [type, setType] = useState<AchievementInput["type"]>("OTHER");
  const [title, setTitle] = useState("");
  const [issuer, setIssuer] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [dateAchieved, setDateAchieved] = useState("");

  const hasDraft = Boolean(
    title.trim() || issuer.trim() || description.trim() || url.trim() || dateAchieved.trim(),
  );

  const addEntry = (): boolean => {
    const t = title.trim();
    if (!t) {
      toast.error("An achievement needs a title");
      return false;
    }
    props.onChange([
      ...props.items,
      {
        type,
        title: t,
        issuer: issuer.trim() || null,
        description: description.trim() || null,
        url: url.trim() || null,
        dateAchieved: dateAchieved.trim() || null,
      },
    ]);
    setType("OTHER");
    setTitle("");
    setIssuer("");
    setDescription("");
    setUrl("");
    setDateAchieved("");
    return true;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {props.items.length === 0 ? (
          <p className="text-xs text-mute">No achievements added yet.</p>
        ) : (
          props.items.map((item, i) => (
            <div
              key={i}
              className="rounded-lg p-3 border border-line bg-surface"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-ink font-semibold">{item.title}</p>
                  <p className="text-xs text-mute">
                    {ACHIEVEMENT_TYPES.find((a) => a.value === item.type)?.label ?? item.type}
                    {item.issuer ? ` · ${item.issuer}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Remove achievement"
                  onClick={() => props.onChange(props.items.filter((_, j) => j !== i))}
                  className="text-mute hover:text-ink transition-colors"
                >×</button>
              </div>
              {item.description ? (
                <p className="mt-2 text-xs text-ink">{item.description}</p>
              ) : null}
            </div>
          ))
        )}
      </div>

      <select
        className="w-full rounded-md border border-line bg-surface p-2 text-ink text-sm"
        value={type}
        onChange={(e) => setType(e.target.value as AchievementInput["type"])}
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
        <Button type="button" variant="outline" onClick={addEntry}>Add achievement</Button>
      </div>

      <UnsavedDraftGuard
        hasDraft={hasDraft}
        itemLabel="an achievement"
        addLabel="Add achievement"
        onAdd={addEntry}
        onContinue={props.onSubmit}
        onBack={props.onBack}
      />
    </div>
  );
}
