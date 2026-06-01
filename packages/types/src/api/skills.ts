// Skill inventory — value lists and request shapes shared across the boundary.
// Strength is two distinct dimensions: confidence (1–5) and proficiency (enum).

import { z } from "zod";

export const skillCategoryValues = ["technical", "soft", "tool"] as const;
export type SkillCategoryValue = (typeof skillCategoryValues)[number];
export const skillCategorySchema = z.enum(skillCategoryValues);

export const skillProficiencyValues = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
] as const;
export type SkillProficiencyValue = (typeof skillProficiencyValues)[number];
export const skillProficiencySchema = z.enum(skillProficiencyValues);

export const learningGoalStatusValues = [
  "PLANNED",
  "LEARNING",
  "COMPLETED",
] as const;
export type LearningGoalStatusValue = (typeof learningGoalStatusValues)[number];
export const learningGoalStatusSchema = z.enum(learningGoalStatusValues);

export interface SkillCreateInput {
  name: string;
  category: SkillCategoryValue;
  confidenceRating: number;
  proficiencyLevel?: SkillProficiencyValue | null;
}

export interface SkillUpdateInput {
  name?: string;
  category?: SkillCategoryValue;
  confidenceRating?: number;
  proficiencyLevel?: SkillProficiencyValue | null;
  lastUsedDate?: string | null;
}

export interface LearningGoalCreateInput {
  skillName: string;
  targetProficiency?: SkillProficiencyValue | null;
  deadline?: string | null;
  status?: LearningGoalStatusValue;
}

export interface LearningGoalUpdateInput {
  skillName?: string;
  targetProficiency?: SkillProficiencyValue | null;
  deadline?: string | null;
  status?: LearningGoalStatusValue;
}
