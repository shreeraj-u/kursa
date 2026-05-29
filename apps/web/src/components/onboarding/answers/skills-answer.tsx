import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@kursa/ui/components/button";
import { Input } from "@kursa/ui/components/input";

import type { SkillCategory, SkillInput } from "@/app/onboarding/schema";

const SKILL_CATEGORIES: { value: SkillCategory; label: string }[] = [
  { value: "technical", label: "Technical" },
  { value: "tool", label: "Tool" },
  { value: "soft", label: "Soft" },
];

type SkillsAnswerProps = {
  skills: SkillInput[];
  onChange: (skills: SkillInput[]) => void;
  onSubmit: () => void;
  onBack: () => void;
};

export function SkillsAnswer(props: SkillsAnswerProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<SkillCategory>("technical");
  const [confidence, setConfidence] = useState(3);

  const addSkill = () => {
    const trimmed = name.trim();
    if (!trimmed) { toast.error("Type a skill name"); return; }
    if (props.skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Already added");
      return;
    }
    props.onChange([...props.skills, { name: trimmed, category, confidenceRating: confidence }]);
    setName("");
    setConfidence(3);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {props.skills.length === 0 ? (
          <p style={{ fontSize: "var(--text-xs)", color: "var(--mute)" }}>No skills added yet.</p>
        ) : (
          props.skills.map((skill, i) => (
            <span
              key={`${skill.name}-${i}`}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1"
              style={{ fontSize: "var(--text-xs)", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }}
            >
              <span>{skill.name}</span>
              <span style={{ color: "var(--mute)" }}>{skill.category}</span>
              <span style={{ color: "var(--mute)" }}>· {skill.confidenceRating}/5</span>
              <button
                type="button"
                aria-label={`Remove ${skill.name}`}
                onClick={() => props.onChange(props.skills.filter((_, j) => j !== i))}
                style={{ color: "var(--mute)" }}
              >×</button>
            </span>
          ))
        )}
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_120px_120px_auto]">
        <Input
          placeholder="Skill (e.g. TypeScript)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
        />
        <select
          className="h-9 rounded-md border bg-[var(--surface)] px-2"
          style={{ borderColor: "var(--line)", fontSize: "var(--text-sm)", color: "var(--ink)" }}
          value={category}
          onChange={(e) => setCategory(e.target.value as SkillCategory)}
        >
          {SKILL_CATEGORIES.map((entry) => (
            <option key={entry.value} value={entry.value}>{entry.label}</option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border bg-[var(--surface)] px-2"
          style={{ borderColor: "var(--line)", fontSize: "var(--text-sm)", color: "var(--ink)" }}
          value={confidence}
          onChange={(e) => setConfidence(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v}/5</option>)}
        </select>
        <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={props.onBack}>Back</Button>
        <Button type="button" onClick={props.onSubmit}>Continue</Button>
      </div>
    </div>
  );
}
