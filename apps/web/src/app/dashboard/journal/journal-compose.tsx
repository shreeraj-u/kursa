"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { COMPOSE_DISPLAY_LABEL, type ComposeType } from "./journal-utils";

const COMPOSE_TYPES: ComposeType[] = ["note", "win", "feedback", "learning"];

type Props = {
  composeType: ComposeType;
  onComposeTypeChange: (t: ComposeType) => void;
  composeText: string;
  onComposeTextChange: (v: string) => void;
  onSubmit: () => void;
  saving: boolean;
  feedbackRole?: "manager" | "peer" | "self";
  onFeedbackRoleChange?: (r: "manager" | "peer" | "self") => void;
  skillNames?: string[];
  onSkillNamesChange?: (skills: string[]) => void;
  availableSkills?: string[];
  impactMetric?: string;
  onImpactMetricChange?: (v: string) => void;
  noteMood?: number;
  onNoteMoodChange?: (v: number) => void;
  placeholder?: string;
};

export function JournalCompose({
  composeType,
  onComposeTypeChange,
  composeText,
  onComposeTextChange,
  onSubmit,
  saving,
  feedbackRole = "peer",
  onFeedbackRoleChange,
  skillNames = [],
  onSkillNamesChange,
  availableSkills = [],
  impactMetric = "",
  onImpactMetricChange,
  noteMood = 3,
  onNoteMoodChange,
  placeholder,
}: Props) {
  const [focused, setFocused] = useState(false);

  const defaultPlaceholder =
    composeType === "win"
      ? "First line = short title, rest = details…"
      : composeType === "feedback"
        ? "Feedback you received — from a manager, peer, or yourself…"
        : composeType === "learning"
          ? "What skill are you learning?"
          : "What do you want Kursa to know?";

  const toggleSkill = (skill: string) => {
    if (!onSkillNamesChange) return;
    if (skillNames.includes(skill)) {
      onSkillNamesChange(skillNames.filter((s) => s !== skill));
    } else {
      onSkillNamesChange([...skillNames, skill]);
    }
  };

  return (
    <motion.div
      layout
      className="rounded-lg overflow-hidden mb-5"
      style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
      animate={{
        boxShadow: focused ? "0 0 0 1px var(--accent-line)" : "none",
      }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="flex items-center gap-1 px-3 py-2 flex-wrap"
        style={{ borderBottom: "1px solid var(--line)", background: "var(--bg-sub)" }}
      >
        {COMPOSE_TYPES.map((id) => (
          <motion.button
            key={id}
            type="button"
            onClick={() => onComposeTypeChange(id)}
            className="mono rounded px-2 py-0.5"
            style={{
              fontSize: 9,
              border: "1px solid",
              borderColor: composeType === id ? "var(--accent-line)" : "transparent",
              background: composeType === id ? "var(--accent-soft)" : "transparent",
              color: composeType === id ? "var(--accent)" : "var(--mute)",
              cursor: "pointer",
            }}
            whileTap={{ scale: 0.95 }}
          >
            {COMPOSE_DISPLAY_LABEL[id]}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {composeType === "feedback" && onFeedbackRoleChange && (
          <motion.div
            key="feedback-role"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex gap-1 px-3 py-2"
            style={{ borderBottom: "1px solid var(--line)" }}
          >
            {(["manager", "peer", "self"] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => onFeedbackRoleChange(role)}
                className="mono rounded px-2 py-0.5"
                style={{
                  fontSize: 9,
                  border: "1px solid var(--line)",
                  background: feedbackRole === role ? "var(--bg-sub-2)" : "transparent",
                  color: feedbackRole === role ? "var(--ink)" : "var(--mute)",
                  cursor: "pointer",
                }}
              >
                {role}
              </button>
            ))}
          </motion.div>
        )}

        {composeType === "win" && availableSkills.length > 0 && onSkillNamesChange && (
          <motion.div
            key="skills"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-wrap gap-1 px-3 py-2"
            style={{ borderBottom: "1px solid var(--line)" }}
          >
            {availableSkills.slice(0, 12).map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className="mono rounded-full px-2 py-0.5"
                style={{
                  fontSize: 8,
                  border: "1px solid",
                  borderColor: skillNames.includes(skill) ? "var(--accent-line)" : "var(--line)",
                  background: skillNames.includes(skill) ? "var(--accent-soft)" : "transparent",
                  color: skillNames.includes(skill) ? "var(--accent)" : "var(--mute)",
                  cursor: "pointer",
                }}
              >
                {skill}
              </button>
            ))}
          </motion.div>
        )}

        {composeType === "note" && onNoteMoodChange && (
          <motion.div
            key="mood"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 py-2"
            style={{ borderBottom: "1px solid var(--line)" }}
          >
            <label className="mono" style={{ fontSize: 9, color: "var(--mute)" }}>
              mood (1–5): {noteMood}
              <input
                type="range"
                min={1}
                max={5}
                value={noteMood}
                onChange={(e) => onNoteMoodChange(Number(e.target.value))}
                className="mt-1 w-full"
                style={{ accentColor: "var(--accent)" }}
              />
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-3">
        <motion.textarea
          layout
          value={composeText}
          onChange={(e) => onComposeTextChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder ?? defaultPlaceholder}
          rows={focused ? 4 : 2}
          className="w-full resize-none bg-transparent outline-none"
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--ink)",
            lineHeight: 1.55,
            minHeight: focused ? 88 : 44,
          }}
          animate={{ minHeight: focused ? 88 : 44 }}
          transition={{ duration: 0.2 }}
        />

        {composeType === "win" && onImpactMetricChange && (
          <input
            value={impactMetric}
            onChange={(e) => onImpactMetricChange(e.target.value)}
            placeholder="Impact metric (optional): e.g. 20% faster, $50k saved"
            className="w-full mt-2 rounded px-2 py-1 outline-none"
            style={{
              fontSize: "var(--text-xs)",
              border: "1px solid var(--line)",
              background: "var(--bg)",
              color: "var(--ink)",
            }}
          />
        )}

        <div className="flex justify-end mt-2">
          <motion.button
            type="button"
            onClick={onSubmit}
            disabled={saving || !composeText.trim()}
            className="mono rounded px-3 py-1"
            style={{
              fontSize: 9,
              background: "var(--accent)",
              color: "var(--accent-fg, #fff)",
              border: "none",
              opacity: saving || !composeText.trim() ? 0.5 : 1,
              cursor: saving || !composeText.trim() ? "not-allowed" : "pointer",
            }}
            whileTap={{ scale: 0.97 }}
          >
            {saving ? "saving…" : "save entry"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
