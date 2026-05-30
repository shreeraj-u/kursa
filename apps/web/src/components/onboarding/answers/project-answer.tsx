import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@kursa/ui/components/button";
import { Input } from "@kursa/ui/components/input";

import type { ProjectInput } from "@kursa/types";

type ProjectAnswerProps = {
  items: ProjectInput[];
  onChange: (items: ProjectInput[]) => void;
  onSubmit: () => void;
  onBack: () => void;
};

export function ProjectAnswer(props: ProjectAnswerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [outcomes, setOutcomes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const addEntry = () => {
    const t = title.trim();
    if (!t) {
      toast.error("A project needs a title");
      return;
    }
    props.onChange([
      ...props.items,
      {
        title: t,
        description: description.trim() || null,
        url: url.trim() || null,
        outcomes: outcomes.trim(),
        startDate: startDate.trim() || null,
        endDate: endDate.trim() || null,
      },
    ]);
    setTitle("");
    setDescription("");
    setUrl("");
    setOutcomes("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {props.items.length === 0 ? (
          <p className="text-xs text-mute">No projects added yet.</p>
        ) : (
          props.items.map((item, i) => (
            <div
              key={i}
              className="rounded-lg p-3 border border-line bg-surface"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-ink font-semibold">{item.title}</p>
                  {item.description ? (
                    <p className="text-xs text-mute">{item.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label="Remove project"
                  onClick={() => props.onChange(props.items.filter((_, j) => j !== i))}
                  className="text-mute hover:text-ink transition-colors"
                >×</button>
              </div>
              {item.outcomes ? (
                <p className="mt-2 text-xs text-ink">{item.outcomes}</p>
              ) : null}
            </div>
          ))
        )}
      </div>

      <Input placeholder="Project title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input placeholder="One-sentence description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <Input placeholder="URL (optional)" value={url} onChange={(e) => setUrl(e.target.value)} />
      <Input placeholder="Outcome / impact (optional)" value={outcomes} onChange={(e) => setOutcomes(e.target.value)} />
      <div className="grid gap-2 md:grid-cols-2">
        <Input placeholder="Start year (e.g. 2021)" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input placeholder="End year (e.g. 2022)" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={addEntry}>Add project</Button>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={props.onBack}>Back</Button>
        <Button type="button" onClick={props.onSubmit}>Continue</Button>
      </div>
    </div>
  );
}
