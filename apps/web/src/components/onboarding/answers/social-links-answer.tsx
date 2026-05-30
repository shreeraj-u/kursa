import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@kursa/ui/components/button";
import { Input } from "@kursa/ui/components/input";

import type { SocialLinkInput } from "@kursa/types";

type SocialLinksAnswerProps = {
  items: SocialLinkInput[];
  onChange: (items: SocialLinkInput[]) => void;
  onSubmit: () => void;
  onBack: () => void;
};

const PLATFORMS: { value: string; label: string }[] = [
  { value: "github", label: "GitHub" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter" },
  { value: "website", label: "Website" },
  { value: "portfolio", label: "Portfolio" },
];

export function SocialLinksAnswer(props: SocialLinksAnswerProps) {
  const [platform, setPlatform] = useState("github");
  const [url, setUrl] = useState("");

  const addEntry = () => {
    const u = url.trim();
    if (!u) {
      toast.error("Add a URL");
      return;
    }
    if (props.items.some((item) => item.platform === platform && item.url.toLowerCase() === u.toLowerCase())) {
      toast.error("Already added that link");
      return;
    }
    props.onChange([...props.items, { platform, url: u }]);
    setPlatform("github");
    setUrl("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {props.items.length === 0 ? (
          <p className="text-xs text-mute">No links added yet.</p>
        ) : (
          props.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg p-3 border border-line bg-surface"
            >
              <p className="text-sm text-ink">
                <span className="font-semibold">
                  {PLATFORMS.find((p) => p.value === item.platform)?.label ?? item.platform}
                </span>{" "}
                · {item.url}
              </p>
              <button
                type="button"
                aria-label="Remove link"
                onClick={() => props.onChange(props.items.filter((_, j) => j !== i))}
                className="text-mute hover:text-ink transition-colors"
              >×</button>
            </div>
          ))
        )}
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <select
          className="w-full rounded-md border border-line bg-surface p-2 text-ink text-sm"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        >
          {PLATFORMS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={addEntry}>Add link</Button>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={props.onBack}>Back</Button>
        <Button type="button" onClick={props.onSubmit}>Continue</Button>
      </div>
    </div>
  );
}
