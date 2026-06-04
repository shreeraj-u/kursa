"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

import { COMPOSE_DISPLAY_LABEL, type ComposeType } from "@/lib/dashboard/journal/journal-utils";

const COMPOSE_TYPES: ComposeType[] = ["note", "win", "feedback", "learning"];

export type JournalComposeData =
  | { type: "note"; text: string; mood: number }
  | { type: "win"; text: string; skillNames: string[]; impactMetric: string }
  | { type: "feedback"; text: string; role: "manager" | "peer" | "self" }
  | { type: "learning"; text: string };

type Props = {
  availableSkills?: string[];
  saving: boolean;
  onSubmit: (data: JournalComposeData) => Promise<boolean> | boolean | void;
  placeholder?: string;
};

export function JournalCompose({
  availableSkills = [],
  saving,
  onSubmit,
  placeholder,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [composeType, setComposeType] = useState<ComposeType>("note");
  const [composeText, setComposeText] = useState("");
  const [feedbackRole, setFeedbackRole] = useState<"manager" | "peer" | "self">("peer");
  const [skillNames, setSkillNames] = useState<string[]>([]);
  const [impactMetric, setImpactMetric] = useState("");
  const [noteMood, setNoteMood] = useState(3);

  const defaultPlaceholder =
    composeType === "win"
      ? "Shipped onboarding cleanup\nReduced manual fixes by 40% and unblocked demo data quality…"
      : composeType === "feedback"
        ? "Feedback you received — e.g. “Your stakeholder updates made the launch calmer”…"
        : composeType === "learning"
          ? "What skill are you learning? e.g. system design, Prisma, product analytics"
          : "What should Aria remember about this week?";

  const toggleSkill = (skill: string) => {
    if (skillNames.includes(skill)) {
      setSkillNames(skillNames.filter((s) => s !== skill));
    } else {
      setSkillNames([...skillNames, skill]);
    }
  };

  const handleSave = async () => {
    const text = composeText.trim();
    if (!text) {
      toast.error("Write something first");
      return;
    }

    const data: JournalComposeData =
      composeType === "win"
        ? { type: "win", text, skillNames, impactMetric }
        : composeType === "feedback"
          ? { type: "feedback", text, role: feedbackRole }
          : composeType === "learning"
            ? { type: "learning", text }
            : { type: "note", text, mood: noteMood };

    const success = await onSubmit(data);
    if (success !== false) {
      setComposeText("");
      setSkillNames([]);
      setImpactMetric("");
    }
  };

  return (
    <motion.div
      layout
      className="rounded-lg overflow-hidden mb-5 border border-line bg-surface"
      animate={{
        boxShadow: focused ? "0 0 0 1px var(--accent-line)" : "none",
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-1 px-3 py-2 flex-wrap border-b border-line bg-bg-sub">
        {COMPOSE_TYPES.map((id) => (
          <motion.button
            key={id}
            type="button"
            onClick={() => setComposeType(id)}
            className={`mono rounded px-2 py-0.5 text-2xs cursor-pointer border transition-colors ${
              composeType === id
                ? "border-accent-line bg-accent-soft text-accent"
                : "border-transparent bg-transparent text-mute hover:text-ink"
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {COMPOSE_DISPLAY_LABEL[id]}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {composeType === "feedback" && (
          <motion.div
            key="feedback-role"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex gap-1 px-3 py-2 border-b border-line"
          >
            {(["manager", "peer", "self"] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setFeedbackRole(role)}
                className={`mono rounded px-2 py-0.5 text-2xs border cursor-pointer transition-colors ${
                  feedbackRole === role
                    ? "border-line bg-bg-sub-2 text-ink"
                    : "border-line bg-transparent text-mute hover:text-ink"
                }`}
              >
                {role}
              </button>
            ))}
          </motion.div>
        )}

        {composeType === "win" && availableSkills.length > 0 && (
          <motion.div
            key="skills"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-wrap gap-1 px-3 py-2 border-b border-line"
          >
            {availableSkills.slice(0, 12).map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={`mono rounded-full px-2 py-0.5 text-[8px] border cursor-pointer transition-colors ${
                  skillNames.includes(skill)
                    ? "border-accent-line bg-accent-soft text-accent"
                    : "border-line bg-transparent text-mute hover:text-ink"
                }`}
              >
                {skill}
              </button>
            ))}
          </motion.div>
        )}

        {composeType === "note" && (
          <motion.div
            key="mood"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 py-2 border-b border-line"
          >
            <label className="mono text-2xs text-mute flex flex-col gap-1">
              mood (1–5): {noteMood}
              <input
                type="range"
                min={1}
                max={5}
                value={noteMood}
                onChange={(e) => setNoteMood(Number(e.target.value))}
                className="w-full cursor-pointer accent-accent"
              />
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-3">
        <motion.textarea
          layout
          value={composeText}
          onChange={(e) => setComposeText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder ?? defaultPlaceholder}
          rows={focused ? 4 : 2}
          className="w-full resize-none bg-transparent outline-none text-xs text-ink leading-relaxed"
          style={{
            minHeight: focused ? 88 : 44,
          }}
          animate={{ minHeight: focused ? 88 : 44 }}
          transition={{ duration: 0.2 }}
        />

        {composeType === "win" && (
          <input
            value={impactMetric}
            onChange={(e) => setImpactMetric(e.target.value)}
            placeholder="Impact metric (optional): e.g. 20% faster, 3 users unblocked, $50k saved"
            className="w-full mt-2 rounded px-2 py-1.5 outline-none border border-line bg-bg text-ink text-xs"
          />
        )}

        <div className="flex justify-end mt-2">
          <motion.button
            type="button"
            onClick={handleSave}
            disabled={saving || !composeText.trim()}
            className="mono rounded px-3 py-1 bg-accent text-white border-none text-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            whileTap={{ scale: 0.97 }}
          >
            {saving ? "saving…" : "save entry"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
