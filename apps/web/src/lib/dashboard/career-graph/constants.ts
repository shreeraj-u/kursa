// Shared Career Graph constants — single source of truth for values that would
// otherwise drift across the canvas, detail panel, and page wrapper.

import type { NodeKind, SkillState } from "./types";

/** Skill "building" state colour (a learning goal). Not a design token, so centralised here. */
export const BUILDING_COLOR = "oklch(0.58 0.12 250)";

/** The diagnostic colour for each skill state — single source for canvas, legend, and filters. */
export const SKILL_STATE_COLOR: Record<SkillState, string> = {
  owned: "var(--accent)",
  dormant: "var(--mute-2)",
  gap: "var(--warn)",
  building: BUILDING_COLOR,
};

export const KIND_LABEL: Record<NodeKind, string> = {
  you: "You",
  role: "Target role",
  milestone: "Milestone",
  skill: "Skill",
  job: "Work history",
  project: "Project",
  achievement: "Achievement",
  education: "Education",
};
